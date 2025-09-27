import { z } from "zod";
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { TemplateEngine } from '../templates/engine.js';
import { validateADFContent } from '../templates/adf-utils.js';
import type { 
  TemplateResult, 
  GenerateTemplateParams, 
  ValidateTemplateParams,
  ListTemplatesResponse 
} from '../templates/types.js';

// Initialize template engine
const templateEngine = new TemplateEngine();

// Tool type definition
interface TemplateTool {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, z.ZodSchema<any>>;
  handler: (params: any) => Promise<{
    content: Array<{
      type: "text";
      text: string;
    }>;
  }>;
}

/**
 * Generate structured template from YAML template
 */
const generateFromTemplateTool: TemplateTool = {
  name: "generate_from_template",
  title: "Generate Intermediate Template for Claude Processing",
  description: "Generate an intermediate markdown template with Claude instructions from a YAML template definition. This creates a template that Claude AI will then process to generate final publication-ready ADF markdown.",
  inputSchema: {
    templateName: z.string().describe("Name of the YAML template to generate from"),
    outputPath: z.string().optional().describe("Optional output path for the generated template"),
    userContext: z.record(z.string()).optional().describe("User context variables for template generation")
  },
  
  async handler(params: GenerateTemplateParams) {
    try {
      // Generate the structured template
      const result = templateEngine.generateStructuredTemplate(
        params.templateName,
        params.userContext
      );

      // Determine output path
      const outputPath = params.outputPath || result.templatePath;

      // Ensure output directory exists
      const outputDir = dirname(outputPath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Write generated content to file
      writeFileSync(outputPath, result.content, 'utf-8');

      // Validate ADF compatibility
      const adfValidation = await validateADFContent(result.content);
      
      const allErrors = [...(result.validation.errors || []), ...(adfValidation.errors || [])];
      const allWarnings = [...(result.validation.warnings || []), ...(adfValidation.warnings || [])];
      const isValid = result.validation.valid && adfValidation.valid;

      let responseText = `✅ **Intermediate Template Generated Successfully**

📄 **YAML Template:** ${params.templateName}
📁 **Output Path:** ${outputPath}
🔍 **Validation:** ${isValid ? 'Valid' : 'Issues Found'}

🔄 **Next Step:** This intermediate template contains Claude instruction comments that need to be processed to generate final documentation.

**Workflow:**
1. ✅ YAML template → Intermediate template (COMPLETED)
2. 🔄 Claude processes instructions → Final ADF markdown (NEXT)
3. 📤 Upload to Confluence (FINAL)

`;

      if (allWarnings.length > 0) {
        responseText += `⚠️ **Warnings:**\n${allWarnings.map(w => `- ${w}`).join('\n')}\n\n`;
      }

      if (allErrors.length > 0) {
        responseText += `❌ **Errors:**\n${allErrors.map(e => `- ${e}`).join('\n')}\n\n`;
      }

      responseText += `📝 **Template Preview (with Claude instructions):**
\`\`\`markdown
${result.content.substring(0, 500)}${result.content.length > 500 ? '...' : ''}
\`\`\``;

      return {
        content: [{
          type: "text" as const,
          text: responseText
        }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Provide helpful suggestions based on error type
      const suggestions: string[] = [];
      if (errorMessage.includes('not found')) {
        const availableTemplates = templateEngine.listTemplates();
        suggestions.push(...availableTemplates.map(t => `${t.name}.yml`));
      }

      let errorText = `❌ **Template Generation Failed**

🔍 **Error:** ${errorMessage}

`;

      if (suggestions.length > 0) {
        errorText += `💡 **Available Templates:**\n${suggestions.map(s => `- ${s}`).join('\n')}`;
      }

      return {
        content: [{
          type: "text" as const,
          text: errorText
        }]
      };
    }
  }
};

/**
 * List all available YAML templates
 */
const listAvailableTemplatesTool: TemplateTool = {
  name: "list_available_templates",
  title: "List Available Templates",
  description: "List all available YAML templates with their metadata and categories",
  inputSchema: {
    category: z.string().optional().describe("Filter templates by category")
  },
  
  async handler(params: { category?: string }) {
    try {
      let templates = templateEngine.listTemplates();
      
      // Filter by category if specified
      if (params.category) {
        templates = templates.filter(t => 
          t.category.toLowerCase() === params.category!.toLowerCase()
        );
      }

      let responseText = `📋 **Available Templates**\n\n`;
      
      if (params.category) {
        responseText += `🏷️ **Filtered by category:** ${params.category}\n\n`;
      }

      if (templates.length === 0) {
        responseText += "❌ No templates found";
        if (params.category) {
          responseText += ` in category "${params.category}"`;
        }
      } else {
        const categories = [...new Set(templates.map(t => t.category))];
        
        for (const category of categories) {
          const categoryTemplates = templates.filter(t => t.category === category);
          responseText += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
          
          for (const template of categoryTemplates) {
            responseText += `### ${template.name}\n`;
            responseText += `📝 **Description:** ${template.description}\n`;
            responseText += `📁 **Path:** ${template.path}\n`;
            if (template.sections.length > 0) {
              responseText += `🗂️ **Sections:** ${template.sections.join(', ')}\n`;
            }
            responseText += '\n';
          }
        }
      }

      return {
        content: [{
          type: "text" as const,
          text: responseText
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: `❌ **Error listing templates:** ${error instanceof Error ? error.message : String(error)}`
        }]
      };
    }
  }
};

/**
 * Validate YAML template structure and ADF compatibility
 */
const validateTemplateTool: TemplateTool = {
  name: "validate_template",
  title: "Validate Template",
  description: "Validate YAML template structure, references, and ADF compatibility",
  inputSchema: {
    templatePath: z.string().describe("Path to the YAML template file to validate")
  },
  
  async handler(params: ValidateTemplateParams) {
    try {
      // Validate template structure
      const validation = templateEngine.validateTemplate(params.templatePath);
      
      // Generate and validate ADF compatibility
      let adfValidation: { valid: boolean; errors: string[]; warnings: string[] } = { 
        valid: true, 
        errors: [], 
        warnings: [] 
      };
      try {
        const templateName = params.templatePath.replace(/\.(yml|yaml)$/, '').split('/').pop() || 'test';
        const generated = templateEngine.generateStructuredTemplate(templateName);
        adfValidation = await validateADFContent(generated.content);
      } catch (error) {
        adfValidation.warnings.push(`Could not generate template for ADF validation: ${error}`);
      }

      const allErrors = [...(validation.errors || []), ...(adfValidation.errors || [])];
      const allWarnings = [...(validation.warnings || []), ...(adfValidation.warnings || [])];
      const isValid = validation.valid && adfValidation.valid;

      let responseText = `🔍 **Template Validation Results**

📄 **Template:** ${params.templatePath}
✅ **Status:** ${isValid ? 'Valid' : 'Issues Found'}

`;

      if (isValid) {
        responseText += `🎉 **Template is valid and ready to use!**\n\n`;
      }

      if (allWarnings.length > 0) {
        responseText += `⚠️ **Warnings:**\n${allWarnings.map(w => `- ${w}`).join('\n')}\n\n`;
      }

      if (allErrors.length > 0) {
        responseText += `❌ **Errors:**\n${allErrors.map(e => `- ${e}`).join('\n')}\n\n`;
        responseText += `💡 **Suggestions:**\n- Check YAML syntax and frontmatter structure\n- Verify all module references exist\n- Ensure required metadata fields are present\n`;
      }

      return {
        content: [{
          type: "text" as const,
          text: responseText
        }]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let errorText = `❌ **Validation Error**

🔍 **Error:** ${errorMessage}

💡 **Suggestions:**
- Ensure the template file exists and is readable
- Check YAML syntax is valid  
- Verify file path is correct`;

      return {
        content: [{
          type: "text" as const,
          text: errorText
        }]
      };
    }
  }
};

/**
 * Create all template tools
 */
export function createTemplateTools(): TemplateTool[] {
  return [
    generateFromTemplateTool,
    listAvailableTemplatesTool,
    validateTemplateTool
  ];
}

/**
 * Get template suggestions for error responses
 */
export function getTemplateSuggestions(errorType: string): string[] {
  const suggestions: string[] = [];
  const templates = templateEngine.listTemplates();

  switch (errorType) {
    case 'template_not_found':
      suggestions.push(...templates.map(t => `${t.name}.yml`));
      break;
    case 'invalid_category':
      const categories = [...new Set(templates.map(t => t.category))];
      suggestions.push(...categories);
      break;
    case 'missing_sections':
      const sections = [...new Set(templates.flatMap(t => t.sections))];
      suggestions.push(...sections);
      break;
  }

  return suggestions;
}