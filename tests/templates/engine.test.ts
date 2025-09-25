import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TemplateEngine } from '../../src/templates/engine.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;
  let testTemplatesDir: string;
  let testGeneratedDir: string;

  beforeEach(() => {
    // Setup test directories
    testTemplatesDir = join(process.cwd(), 'tests', 'fixtures', 'templates');
    testGeneratedDir = join(process.cwd(), 'tests', 'fixtures', 'generated');
    
    if (!existsSync(testTemplatesDir)) {
      mkdirSync(testTemplatesDir, { recursive: true });
    }
    if (!existsSync(testGeneratedDir)) {
      mkdirSync(testGeneratedDir, { recursive: true });
    }

    engine = new TemplateEngine(testTemplatesDir, testGeneratedDir);
  });

  afterEach(() => {
    // Clean up test fixtures
    if (existsSync(testTemplatesDir)) {
      rmSync(testTemplatesDir, { recursive: true, force: true });
    }
    if (existsSync(testGeneratedDir)) {
      rmSync(testGeneratedDir, { recursive: true, force: true });
    }
  });

  describe('parseTemplate', () => {
    test('should parse valid YAML template with frontmatter', () => {
      const templatePath = join(testTemplatesDir, 'test-basic.yml');
      const templateContent = `---
name: Test Template
description: A test template
version: 1.0.0
category: test
output_type: structured_template
sections:
  - introduction
  - examples
---
structure:
  - "# Introduction"
  - type: info_panel
    title: "Welcome"
    content_instruction: "Create welcome message"
  - section: "Examples"
    description: "Code examples section"
    content_instruction: "Add relevant code examples"
`;

      writeFileSync(templatePath, templateContent);

      const result = engine.parseTemplate(templatePath);

      expect(result.metadata.name).toBe('Test Template');
      expect(result.metadata.description).toBe('A test template');
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.category).toBe('test');
      expect(result.metadata.sections).toEqual(['introduction', 'examples']);
      expect(result.structure).toHaveLength(3);
      expect(result.structure[0]).toBe('# Introduction');
    });

    test('should throw error for non-existent template', () => {
      const templatePath = join(testTemplatesDir, 'nonexistent.yml');

      expect(() => engine.parseTemplate(templatePath)).toThrow('Template file not found');
    });

    test('should throw error for template without frontmatter', () => {
      const templatePath = join(testTemplatesDir, 'invalid.yml');
      writeFileSync(templatePath, 'structure:\n  - "# Test"');

      expect(() => engine.parseTemplate(templatePath)).toThrow('Template must contain YAML frontmatter');
    });

    test('should handle template with user context requirements', () => {
      const templatePath = join(testTemplatesDir, 'context-required.yml');
      const templateContent = `---
name: Context Template
description: Template requiring user context
version: 1.0.0
category: test
user_context_required:
  project_name: "What is the project name?"
  api_version: "What API version are you documenting?"
---
structure:
  - "# {{project_name}} API v{{api_version}}"
`;

      writeFileSync(templatePath, templateContent);

      const result = engine.parseTemplate(templatePath);

      expect(result.user_context_required).toEqual({
        project_name: "What is the project name?",
        api_version: "What API version are you documenting?"
      });
    });
  });

  describe('validateTemplate', () => {
    test('should validate correct template structure', () => {
      const templatePath = join(testTemplatesDir, 'valid-template.yml');
      const templateContent = `---
name: Valid Template
description: A valid test template
version: 1.0.0
category: test
---
structure:
  - "# Introduction"
  - section: "Getting Started"
    description: "Initial setup instructions"
    content_instruction: "Provide step-by-step setup guide"
`;

      writeFileSync(templatePath, templateContent);

      const result = engine.validateTemplate(templatePath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required metadata fields', () => {
      const templatePath = join(testTemplatesDir, 'missing-fields.yml');
      const templateContent = `---
name: Incomplete Template
# Missing description, version, category
---
structure:
  - "# Test"
`;

      writeFileSync(templatePath, templateContent);

      const result = engine.validateTemplate(templatePath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // The actual validation error comes from Zod schema validation
      expect(result.errors[0]).toContain('Template validation failed');
    });

    test('should detect invalid module references', () => {
      const templatePath = join(testTemplatesDir, 'bad-reference.yml');
      const templateContent = `---
name: Bad Reference Template
description: Template with invalid reference
version: 1.0.0
category: test
---
structure:
  - module_ref: "@templates/yaml/nonexistent.yml#section"
`;

      writeFileSync(templatePath, templateContent);

      const result = engine.validateTemplate(templatePath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Referenced template file not found'))).toBe(true);
    });
  });

  describe('generateStructuredTemplate', () => {
    test('should generate intermediate template with Claude instructions', () => {
      const templatePath = join(testTemplatesDir, 'generate-test.yml');
      const templateContent = `---
name: Generate Test
description: Template for testing generation
version: 1.0.0
category: test
---
structure:
  - "# API Documentation"
  - type: info_panel
    title: "Overview"
    content_instruction: "Provide API overview"
    purpose: "Welcome new developers"
  - section: "Authentication"
    description: "Security and authentication details"
    content_instruction: "Explain authentication methods"
`;

      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('generate-test');

      expect(result.content).toContain('# Generate Test');
      expect(result.content).toContain('<!-- INTERMEDIATE TEMPLATE - FOR CLAUDE PROCESSING -->');
      expect(result.content).toContain('<!-- Template: Generate Test v1.0.0 -->');
      expect(result.content).toContain('<!-- Category: test -->');
      expect(result.content).toContain('CLAUDE INSTRUCTION: REPLACE THIS COMMENT WITH CONTENT');
      expect(result.content).toContain('TASK: Provide API overview');
      expect(result.content).toContain('PURPOSE: Welcome new developers');
      expect(result.content).toContain('ADF FORMATTING OPTIONS:');
      expect(result.validation.valid).toBe(true);
    });

    test('should handle user context in template generation', () => {
      const templatePath = join(testTemplatesDir, 'context-template.yml');
      const templateContent = `---
name: Context Template
description: Template with user context
version: 1.0.0
category: test
user_context_required:
  service_name: "What is the service name?"
---
structure:
  - "# {{service_name}} Documentation"
  - section: "Setup"
    description: "Setup instructions for {{service_name}}"
`;

      writeFileSync(templatePath, templateContent);

      const userContext = { service_name: 'Payment API' };
      const result = engine.generateStructuredTemplate('context-template', userContext);

      expect(result.content).toContain('Context Template');
      expect(result.content).toContain('<!-- User Context Required:');
      expect(result.content).toContain('service_name: What is the service name?');
    });

    test('should throw error for invalid template', () => {
      const templatePath = join(testTemplatesDir, 'invalid-generate.yml');
      const templateContent = `---
name: Invalid Template
# Missing required fields
---
structure: []
`;

      writeFileSync(templatePath, templateContent);

      expect(() => engine.generateStructuredTemplate('invalid-generate')).toThrow('Template validation failed');
    });
  });

  describe('listTemplates', () => {
    test('should list all valid templates in directory', () => {
      // Create multiple test templates
      const template1 = `---
name: Template One
description: First test template
version: 1.0.0
category: api
sections: [introduction, examples]
---
structure:
  - "# Template One"
`;

      const template2 = `---
name: Template Two
description: Second test template
version: 2.0.0
category: user-guide
sections: [setup, configuration]
---
structure:
  - "# Template Two"
`;

      writeFileSync(join(testTemplatesDir, 'template-one.yml'), template1);
      writeFileSync(join(testTemplatesDir, 'template-two.yaml'), template2);

      const templates = engine.listTemplates();

      expect(templates).toHaveLength(2);
      
      const template1Result = templates.find(t => t.name === 'template-one');
      expect(template1Result).toBeDefined();
      expect(template1Result?.description).toBe('First test template');
      expect(template1Result?.category).toBe('api');
      expect(template1Result?.sections).toEqual(['introduction', 'examples']);

      const template2Result = templates.find(t => t.name === 'template-two');
      expect(template2Result).toBeDefined();
      expect(template2Result?.description).toBe('Second test template');
      expect(template2Result?.category).toBe('user-guide');
      expect(template2Result?.sections).toEqual(['setup', 'configuration']);
    });

    test('should return empty array when templates directory does not exist', () => {
      const nonExistentEngine = new TemplateEngine('/nonexistent/path', testGeneratedDir);
      const templates = nonExistentEngine.listTemplates();

      expect(templates).toEqual([]);
    });

    test('should skip invalid templates and continue processing', () => {
      // Valid template
      const validTemplate = `---
name: Valid Template
description: A valid template
version: 1.0.0
category: test
---
structure:
  - "# Valid"
`;

      // Invalid template (missing frontmatter)
      const invalidTemplate = `structure:
  - "# Invalid"
`;

      writeFileSync(join(testTemplatesDir, 'valid.yml'), validTemplate);
      writeFileSync(join(testTemplatesDir, 'invalid.yml'), invalidTemplate);

      const templates = engine.listTemplates();

      expect(templates).toHaveLength(1);
      expect(templates[0].name).toBe('valid');
    });
  });

  describe('ADF suggestion generation', () => {
    test('should generate appropriate ADF suggestions based on content keywords', () => {
      const templatePath = join(testTemplatesDir, 'adf-suggestions.yml');
      const templateContent = `---
name: ADF Suggestions Test
description: Testing ADF suggestion generation
version: 1.0.0
category: test
---
structure:
  - section: "Security Guidelines"
    description: "Important security warnings and best practices"
    content_instruction: "Document security requirements"
  - section: "Code Examples"
    description: "Example code snippets and implementations"
    content_instruction: "Provide working code examples"
  - section: "Advanced Configuration"
    description: "Detailed configuration options for advanced users"
    content_instruction: "Explain advanced settings"
`;

      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('adf-suggestions');

      // Security section should suggest warning panels
      expect(result.content).toContain('~~~panel type=warning title="Security Notice"');
      
      // Code examples should suggest code blocks
      expect(result.content).toContain('Code blocks with ```bash, ```javascript, ```json');
      
      // Advanced section should suggest expandable content
      expect(result.content).toContain('~~~expand title="Advanced Details"');
    });
  });
});