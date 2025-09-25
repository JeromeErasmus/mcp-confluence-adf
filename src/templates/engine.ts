import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';

// Template metadata schema
const TemplateMetadataSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  category: z.string(),
  output_type: z.string().default('structured_template'),
  sections: z.array(z.string()).optional(),
  user_context_required: z.record(z.string()).optional()
});

// Template structure item schemas
const TemplateStructureItemSchema = z.union([
  z.string(), // Direct markdown headings
  z.object({
    type: z.string(),
    title: z.string().optional(),
    content_instruction: z.string(),
    language: z.string().optional(),
    purpose: z.string().optional(),
    content_context: z.string().optional()
  }),
  z.object({
    section: z.string(),
    description: z.string(),
    content_instruction: z.string().optional()
  }),
  z.object({
    module_ref: z.string(),
    content_context: z.string().optional()
  })
]);

// Full template schema
const TemplateSchema = z.object({
  metadata: TemplateMetadataSchema,
  structure: z.array(TemplateStructureItemSchema),
  user_context_required: z.record(z.string()).optional()
});

export interface TemplateMetadata {
  name: string;
  description: string;
  version: string;
  category: string;
  output_type: string;
  sections?: string[];
  user_context_required?: Record<string, string>;
}

export interface TemplateStructureItem {
  type?: string;
  title?: string;
  content_instruction?: string;
  language?: string;
  purpose?: string;
  content_context?: string;
  section?: string;
  description?: string;
  module_ref?: string;
}

export interface ParsedTemplate {
  metadata: TemplateMetadata;
  structure: (string | TemplateStructureItem)[];
  user_context_required?: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface GeneratedTemplate {
  content: string;
  validation: ValidationResult;
  templatePath: string;
}

export class TemplateEngine {
  private templatesDir: string;
  private generatedDir: string;

  constructor(templatesDir?: string, generatedDir?: string) {
    this.templatesDir = templatesDir || join(process.cwd(), 'templates', 'yaml');
    this.generatedDir = generatedDir || join(process.cwd(), 'templates', 'generated');
  }

  /**
   * Parse YAML template file
   */
  parseTemplate(templatePath: string): ParsedTemplate {
    if (!existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    try {
      const content = readFileSync(templatePath, 'utf-8');
      
      // Split frontmatter and structure
      const parts = content.split('---');
      if (parts.length < 3) {
        throw new Error('Template must contain YAML frontmatter');
      }

      const frontmatter = parts[1].trim();
      const structureYaml = parts.slice(2).join('---').trim();

      const metadata = parseYaml(frontmatter) as TemplateMetadata;
      const yamlData = parseYaml(structureYaml) as any;

      const parsed: ParsedTemplate = {
        metadata,
        structure: yamlData.structure || [],
        user_context_required: yamlData.user_context_required || metadata.user_context_required
      };

      // Validate schema
      const validation = TemplateSchema.safeParse({
        metadata: parsed.metadata,
        structure: parsed.structure,
        user_context_required: parsed.user_context_required
      });

      if (!validation.success) {
        throw new Error(`Template validation failed: ${validation.error.message}`);
      }

      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate template structure and references
   */
  validateTemplate(templatePath: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const template = this.parseTemplate(templatePath);

      // Check required metadata fields
      if (!template.metadata.name) {
        result.errors.push('Missing required metadata field: name');
      }
      if (!template.metadata.description) {
        result.errors.push('Missing required metadata field: description');
      }
      if (!template.metadata.version) {
        result.errors.push('Missing required metadata field: version');
      }
      if (!template.metadata.category) {
        result.errors.push('Missing required metadata field: category');
      }

      // Validate structure items
      for (let i = 0; i < template.structure.length; i++) {
        const item = template.structure[i];
        
        if (typeof item === 'object' && 'module_ref' in item) {
          // Validate module references
          const refPath = this.resolveModuleReference(item.module_ref);
          if (!existsSync(refPath.file)) {
            result.errors.push(`Referenced template file not found: ${item.module_ref}`);
          }
        }
      }

      // Check for circular references
      const circularRefs = this.detectCircularReferences(templatePath);
      if (circularRefs.length > 0) {
        result.errors.push(`Circular references detected: ${circularRefs.join(' -> ')}`);
      }

      result.valid = result.errors.length === 0;

    } catch (error) {
      result.valid = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    return result;
  }

  /**
   * Generate structured template with ADF suggestions
   */
  generateStructuredTemplate(templateName: string, userContext?: Record<string, string>): GeneratedTemplate {
    const templatePath = this.findTemplate(templateName);
    const validation = this.validateTemplate(templatePath);
    
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    const template = this.parseTemplate(templatePath);
    const content = this.buildTemplateContent(template, userContext);
    
    const outputPath = join(this.generatedDir, `${templateName}-template.md`);
    
    return {
      content,
      validation,
      templatePath: outputPath
    };
  }

  /**
   * List available templates
   */
  listTemplates(): Array<{
    name: string;
    description: string;
    category: string;
    sections: string[];
    path: string;
  }> {
    if (!existsSync(this.templatesDir)) {
      return [];
    }

    const templates: Array<any> = [];
    const files = readdirSync(this.templatesDir).filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

    for (const file of files) {
      try {
        const filePath = join(this.templatesDir, file);
        const template = this.parseTemplate(filePath);
        
        templates.push({
          name: file.replace(/\.(yml|yaml)$/, ''),
          description: template.metadata.description,
          category: template.metadata.category,
          sections: template.metadata.sections || [],
          path: filePath
        });
      } catch (error) {
        // Skip invalid templates
        continue;
      }
    }

    return templates;
  }

  /**
   * Build intermediate template content with Claude instructions and ADF suggestions
   * This creates a template that Claude AI will process to generate final documentation
   */
  private buildTemplateContent(template: ParsedTemplate, userContext?: Record<string, string>): string {
    let content = `# ${template.metadata.name}\n\n`;
    
    // Add template metadata and workflow instructions
    content += `<!-- INTERMEDIATE TEMPLATE - FOR CLAUDE PROCESSING -->\n`;
    content += `<!-- Template: ${template.metadata.name} v${template.metadata.version} -->\n`;
    content += `<!-- Category: ${template.metadata.category} -->\n`;
    content += `<!-- Description: ${template.metadata.description} -->\n`;
    content += `<!-- \n`;
    content += `WORKFLOW: This is an intermediate template with Claude instructions.\n`;
    content += `1. This file contains structured content placeholders\n`;
    content += `2. Claude AI will replace instruction comments with actual content\n`;
    content += `3. Final output will be publication-ready ADF markdown for Confluence\n`;
    content += `-->\n\n`;

    for (const item of template.structure) {
      if (typeof item === 'string') {
        // Direct markdown heading
        content += `${item}\n\n`;
      } else if ('module_ref' in item) {
        // Handle module references
        content += this.resolveModuleContent(item.module_ref, item.content_context, userContext);
      } else if ('section' in item) {
        // Section with description and ADF suggestions
        content += `## ${item.section}\n\n`;
        content += this.generateADFSuggestions(item.section, item.description || '', item.content_instruction);
        content += '\n\n';
      } else if ('type' in item) {
        // Typed content block
        content += this.generateTypedContent(item);
        content += '\n\n';
      }
    }

    // Add user context requirements
    if (template.user_context_required) {
      content += '\n<!-- User Context Required:\n';
      for (const [key, question] of Object.entries(template.user_context_required)) {
        content += `${key}: ${question}\n`;
      }
      content += '-->\n';
    }

    return content;
  }

  /**
   * Generate Claude instruction comments with ADF suggestions
   * These comments guide Claude to create appropriate content with proper ADF formatting
   */
  private generateADFSuggestions(sectionName: string, description: string, instruction?: string): string {
    const keywords = description.toLowerCase();
    const suggestions: string[] = [];
    
    // Dynamic keyword-based suggestions
    if (keywords.includes('introduction') || keywords.includes('overview')) {
      suggestions.push('- ~~~panel type=info title="Overview" for key information');
    }
    if (keywords.includes('security') || keywords.includes('warning') || keywords.includes('important')) {
      suggestions.push('- ~~~panel type=warning title="Security Notice" for important warnings');
    }
    if (keywords.includes('success') || keywords.includes('complete') || keywords.includes('done')) {
      suggestions.push('- ~~~panel type=success title="Success" for positive completion messages');
    }
    if (keywords.includes('example') || keywords.includes('code') || keywords.includes('snippet')) {
      suggestions.push('- Code blocks with ```bash, ```javascript, ```json, etc.');
    }
    if (keywords.includes('expand') || keywords.includes('detail') || keywords.includes('more')) {
      suggestions.push('- ~~~expand title="Advanced Details" for collapsible content');
    }
    if (keywords.includes('table') || keywords.includes('list') || keywords.includes('data')) {
      suggestions.push('- Standard markdown tables for structured data');
    }
    if (keywords.includes('note') || keywords.includes('tip') || keywords.includes('remember')) {
      suggestions.push('- ~~~panel type=note title="Important Note" for additional information');
    }

    // Build Claude instruction comment
    let content = `<!-- CLAUDE INSTRUCTION: REPLACE THIS COMMENT WITH CONTENT\n`;
    content += `TASK: ${description}`;
    if (instruction) {
      content += ` - ${instruction}`;
    }
    content += `\n\nCONTENT GUIDELINES:\n`;
    content += `- Write clear, comprehensive content for the "${sectionName}" section\n`;
    content += `- Use proper markdown formatting\n`;
    content += `- Include specific, actionable information\n`;
    
    if (suggestions.length > 0) {
      content += `\nADF FORMATTING OPTIONS:\n${suggestions.join('\n')}\n`;
    }
    
    content += `\nREMOVE THIS ENTIRE COMMENT WHEN GENERATING CONTENT\n`;
    content += ` -->`;

    return content;
  }

  /**
   * Generate typed content blocks with enhanced Claude instructions
   */
  private generateTypedContent(item: TemplateStructureItem): string {
    let content = '';
    
    if (item.title) {
      content += `### ${item.title}\n\n`;
    }

    const suggestions: string[] = [];
    let recommendedFormat = '';
    
    switch (item.type) {
      case 'info_panel':
        suggestions.push(`- ~~~panel type=info title="${item.title || 'Information'}"`);
        recommendedFormat = 'Use an info panel for this content';
        break;
      case 'warning_panel':
        suggestions.push(`- ~~~panel type=warning title="${item.title || 'Warning'}"`);
        recommendedFormat = 'Use a warning panel for this content';
        break;
      case 'success_panel':
        suggestions.push(`- ~~~panel type=success title="${item.title || 'Success'}"`);
        recommendedFormat = 'Use a success panel for this content';
        break;
      case 'code_block':
        if (item.language) {
          suggestions.push(`- \`\`\`${item.language} code block with proper syntax highlighting`);
          recommendedFormat = `Use a ${item.language} code block`;
        } else {
          suggestions.push('- ```language code block (specify appropriate language)');
          recommendedFormat = 'Use a code block with appropriate language';
        }
        break;
      case 'expandable':
        suggestions.push(`- ~~~expand title="${item.title || 'Details'}"`);
        recommendedFormat = 'Use an expandable section for this content';
        break;
    }

    // Generate enhanced Claude instruction
    content += `<!-- CLAUDE INSTRUCTION: REPLACE THIS COMMENT WITH CONTENT\n`;
    content += `TASK: ${item.content_instruction || 'Generate appropriate content for this section'}\n`;
    if (item.purpose) {
      content += `PURPOSE: ${item.purpose}\n`;
    }
    if (item.content_context) {
      content += `CONTEXT: ${item.content_context}\n`;
    }
    content += `\nFORMAT REQUIREMENT: ${recommendedFormat}\n`;
    
    if (suggestions.length > 0) {
      content += `\nADF FORMATTING OPTIONS:\n${suggestions.join('\n')}\n`;
    }
    
    content += `\nCONTENT GUIDELINES:\n`;
    content += `- Provide specific, actionable information\n`;
    content += `- Use clear, professional language\n`;
    content += `- Include examples where appropriate\n`;
    content += `\nREMOVE THIS ENTIRE COMMENT WHEN GENERATING CONTENT\n`;
    content += ` -->`;

    return content;
  }

  /**
   * Find template file by name
   */
  private findTemplate(templateName: string): string {
    // Try exact match first
    let templatePath = join(this.templatesDir, `${templateName}.yml`);
    if (existsSync(templatePath)) {
      return templatePath;
    }

    templatePath = join(this.templatesDir, `${templateName}.yaml`);
    if (existsSync(templatePath)) {
      return templatePath;
    }

    // Try pattern match
    if (existsSync(this.templatesDir)) {
      const files = readdirSync(this.templatesDir);
      const match = files.find(file => 
        file.includes(templateName) && (file.endsWith('.yml') || file.endsWith('.yaml'))
      );
      
      if (match) {
        return join(this.templatesDir, match);
      }
    }

    throw new Error(`Template not found: ${templateName}`);
  }

  /**
   * Resolve module reference path and section
   */
  private resolveModuleReference(moduleRef: string): { file: string; section?: string } {
    const parts = moduleRef.split('#');
    const refPath = parts[0].replace('@templates/yaml/', '');
    const section = parts[1];
    
    return {
      file: join(this.templatesDir, refPath),
      section
    };
  }

  /**
   * Resolve module content
   */
  private resolveModuleContent(moduleRef: string, context?: string, userContext?: Record<string, string>): string {
    const { file, section } = this.resolveModuleReference(moduleRef);
    
    try {
      const referencedTemplate = this.parseTemplate(file);
      
      if (section) {
        // Find specific section
        const sectionItem = referencedTemplate.structure.find((item): item is TemplateStructureItem => 
          typeof item === 'object' && 'section' in item && item.section === section
        );
        
        if (sectionItem && 'section' in sectionItem) {
          let content = `## ${sectionItem.section}\n\n`;
          content += this.generateADFSuggestions(sectionItem.section, sectionItem.description || '', context);
          return content + '\n\n';
        }
      } else {
        // Include entire template structure
        return this.buildTemplateContent(referencedTemplate, userContext);
      }
    } catch (error) {
      return `<!-- Error resolving module reference: ${moduleRef} - ${error} -->\n\n`;
    }

    return `<!-- Module reference not found: ${moduleRef} -->\n\n`;
  }

  /**
   * Detect circular references in template dependencies
   */
  private detectCircularReferences(templatePath: string, visited: Set<string> = new Set()): string[] {
    if (visited.has(templatePath)) {
      return [templatePath];
    }

    visited.add(templatePath);

    try {
      const template = this.parseTemplate(templatePath);
      
      for (const item of template.structure) {
        if (typeof item === 'object' && 'module_ref' in item) {
          const { file } = this.resolveModuleReference(item.module_ref);
          const cycle = this.detectCircularReferences(file, new Set(visited));
          
          if (cycle.length > 0) {
            return [templatePath, ...cycle];
          }
        }
      }
    } catch (error) {
      // Ignore errors for circular reference detection
    }

    return [];
  }
}