import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TemplateEngine } from '../../src/templates/engine.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('YAML to Markdown Conversion', () => {
  let engine: TemplateEngine;
  let testTemplatesDir: string;
  let testGeneratedDir: string;

  beforeEach(() => {
    testTemplatesDir = join(process.cwd(), 'tests', 'fixtures', 'markdown-conversion');
    testGeneratedDir = join(process.cwd(), 'tests', 'fixtures', 'markdown-conversion-generated');
    
    if (!existsSync(testTemplatesDir)) {
      mkdirSync(testTemplatesDir, { recursive: true });
    }
    if (!existsSync(testGeneratedDir)) {
      mkdirSync(testGeneratedDir, { recursive: true });
    }

    engine = new TemplateEngine(testTemplatesDir, testGeneratedDir);
  });

  afterEach(() => {
    if (existsSync(testTemplatesDir)) {
      rmSync(testTemplatesDir, { recursive: true, force: true });
    }
    if (existsSync(testGeneratedDir)) {
      rmSync(testGeneratedDir, { recursive: true, force: true });
    }
  });

  describe('Basic Markdown generation', () => {
    test('should convert simple YAML structure to Markdown with Claude instructions', () => {
      const templateContent = `---
name: Simple Test
description: Basic template conversion test
version: 1.0.0
category: test
---
structure:
  - "# Main Header"
  - "## Subheader"
  - "This is a paragraph."
`;

      const templatePath = join(testTemplatesDir, 'simple.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('simple');

      expect(result.content).toContain('# Simple Test');
      expect(result.content).toContain('<!-- INTERMEDIATE TEMPLATE - FOR CLAUDE PROCESSING -->');
      expect(result.content).toContain('<!-- Template: Simple Test v1.0.0 -->');
      expect(result.content).toContain('<!-- Category: test -->');
      expect(result.content).toContain('# Main Header');
      expect(result.content).toContain('## Subheader');
      expect(result.content).toContain('This is a paragraph.');
    });

    test('should generate template metadata header', () => {
      const templateContent = `---
name: Metadata Test
description: Testing metadata generation
version: 2.1.0
category: documentation
sections:
  - intro
  - setup
---
structure:
  - "# Content"
`;

      const templatePath = join(testTemplatesDir, 'metadata.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('metadata');

      expect(result.content).toContain('<!-- INTERMEDIATE TEMPLATE - FOR CLAUDE PROCESSING -->');
      expect(result.content).toContain('<!-- Template: Metadata Test v2.1.0 -->');
      expect(result.content).toContain('<!-- Category: documentation -->');
      expect(result.content).toContain('<!-- Sections: intro, setup -->');
      expect(result.content).toContain('<!-- Generated: ');
    });
  });

  describe('ADF component conversion to Markdown', () => {
    test('should convert info panels to Markdown with Claude instructions', () => {
      const templateContent = `---
name: Info Panel Test
description: Test info panel conversion
version: 1.0.0
category: test
---
structure:
  - type: info_panel
    title: "Important Information"
    content_instruction: "Add crucial details here"
    purpose: "Highlight key information for users"
`;

      const templatePath = join(testTemplatesDir, 'info-panel.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('info-panel');

      expect(result.content).toContain('> ℹ️ **Important Information**');
      expect(result.content).toContain('<!-- CLAUDE INSTRUCTION: REPLACE THIS COMMENT WITH CONTENT -->');
      expect(result.content).toContain('<!-- TASK: Add crucial details here -->');
      expect(result.content).toContain('<!-- PURPOSE: Highlight key information for users -->');
      expect(result.content).toContain('<!-- ADF FORMATTING OPTIONS: -->');
      expect(result.content).toContain('~~~panel type=info title="Important Information"');
    });

    test('should convert warning panels to Markdown', () => {
      const templateContent = `---
name: Warning Panel Test
description: Test warning panel conversion
version: 1.0.0
category: test
---
structure:
  - type: warning_panel
    title: "Security Warning"
    content_instruction: "Document security considerations"
`;

      const templatePath = join(testTemplatesDir, 'warning-panel.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('warning-panel');

      expect(result.content).toContain('> ⚠️ **Security Warning**');
      expect(result.content).toContain('<!-- TASK: Document security considerations -->');
      expect(result.content).toContain('~~~panel type=warning title="Security Warning"');
    });

    test('should convert success panels to Markdown', () => {
      const templateContent = `---
name: Success Panel Test
description: Test success panel conversion
version: 1.0.0
category: test
---
structure:
  - type: success_panel
    title: "Setup Complete"
    content_instruction: "Congratulate the user on successful setup"
`;

      const templatePath = join(testTemplatesDir, 'success-panel.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('success-panel');

      expect(result.content).toContain('> ✅ **Setup Complete**');
      expect(result.content).toContain('~~~panel type=success title="Setup Complete"');
    });

    test('should convert note panels to Markdown', () => {
      const templateContent = `---
name: Note Panel Test
description: Test note panel conversion
version: 1.0.0
category: test
---
structure:
  - type: note_panel
    title: "Additional Notes"
    content_instruction: "Add supplementary information"
`;

      const templatePath = join(testTemplatesDir, 'note-panel.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('note-panel');

      expect(result.content).toContain('> 📝 **Additional Notes**');
      expect(result.content).toContain('~~~panel type=note title="Additional Notes"');
    });
  });

  describe('Code block conversion', () => {
    test('should convert code blocks with language and title', () => {
      const templateContent = `---
name: Code Block Test
description: Test code block conversion
version: 1.0.0
category: test
---
structure:
  - type: code_block
    language: "javascript"
    title: "Example Function"
    content_instruction: "Show a function that handles user input"
    purpose: "Demonstrate basic functionality"
`;

      const templatePath = join(testTemplatesDir, 'code-block.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('code-block');

      expect(result.content).toContain('**Example Function**');
      expect(result.content).toContain('```javascript');
      expect(result.content).toContain('<!-- CLAUDE INSTRUCTION: REPLACE THIS COMMENT WITH CONTENT -->');
      expect(result.content).toContain('<!-- TASK: Show a function that handles user input -->');
      expect(result.content).toContain('<!-- PURPOSE: Demonstrate basic functionality -->');
      expect(result.content).toContain('```');
    });

    test('should handle code blocks without titles', () => {
      const templateContent = `---
name: Untitled Code Block
description: Test code block without title
version: 1.0.0
category: test
---
structure:
  - type: code_block
    language: "bash"
    content_instruction: "Show installation commands"
`;

      const templatePath = join(testTemplatesDir, 'untitled-code.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('untitled-code');

      expect(result.content).toContain('```bash');
      expect(result.content).not.toContain('**undefined**');
      expect(result.content).toContain('<!-- TASK: Show installation commands -->');
    });

    test('should handle different programming languages', () => {
      const templateContent = `---
name: Multi Language Test
description: Test multiple programming languages
version: 1.0.0
category: test
---
structure:
  - type: code_block
    language: "python"
    title: "Python Example"
    content_instruction: "Python code example"
  - type: code_block
    language: "sql"
    title: "Database Query"
    content_instruction: "SQL query example"
  - type: code_block
    language: "json"
    title: "Configuration"
    content_instruction: "JSON configuration example"
`;

      const templatePath = join(testTemplatesDir, 'multi-lang.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('multi-lang');

      expect(result.content).toContain('```python');
      expect(result.content).toContain('```sql');
      expect(result.content).toContain('```json');
      expect(result.content).toContain('**Python Example**');
      expect(result.content).toContain('**Database Query**');
      expect(result.content).toContain('**Configuration**');
    });
  });

  describe('Expandable section conversion', () => {
    test('should convert expandable sections to Markdown', () => {
      const templateContent = `---
name: Expandable Test
description: Test expandable section conversion
version: 1.0.0
category: test
---
structure:
  - type: expandable
    title: "Advanced Configuration"
    content_instruction: "Document advanced settings and options"
    purpose: "Hide complex details to reduce cognitive load"
`;

      const templatePath = join(testTemplatesDir, 'expandable.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('expandable');

      expect(result.content).toContain('<details>');
      expect(result.content).toContain('<summary><strong>Advanced Configuration</strong></summary>');
      expect(result.content).toContain('<!-- CLAUDE INSTRUCTION: REPLACE THIS COMMENT WITH CONTENT -->');
      expect(result.content).toContain('<!-- TASK: Document advanced settings and options -->');
      expect(result.content).toContain('<!-- PURPOSE: Hide complex details to reduce cognitive load -->');
      expect(result.content).toContain('~~~expand title="Advanced Configuration"');
      expect(result.content).toContain('</details>');
    });

    test('should handle expandable sections with default state', () => {
      const templateContent = `---
name: Expandable State Test
description: Test expandable with default states
version: 1.0.0
category: test
---
structure:
  - type: expandable
    title: "Collapsed by Default"
    content_instruction: "This content is hidden initially"
    collapsed_by_default: true
  - type: expandable
    title: "Expanded by Default"
    content_instruction: "This content is visible initially"
    collapsed_by_default: false
`;

      const templatePath = join(testTemplatesDir, 'expandable-states.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('expandable-states');

      expect(result.content).toContain('<details>');
      expect(result.content).toContain('<details open>');
    });
  });

  describe('Section conversion', () => {
    test('should convert section objects to headers with instructions', () => {
      const templateContent = `---
name: Section Test
description: Test section conversion
version: 1.0.0
category: test
---
structure:
  - section: "Getting Started"
    description: "Initial setup and configuration guide"
    content_instruction: "Provide step-by-step setup instructions with screenshots"
    purpose: "Help new users get up and running quickly"
`;

      const templatePath = join(testTemplatesDir, 'sections.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('sections');

      expect(result.content).toContain('## Getting Started');
      expect(result.content).toContain('<!-- Section: Getting Started -->');
      expect(result.content).toContain('<!-- Description: Initial setup and configuration guide -->');
      expect(result.content).toContain('<!-- CLAUDE INSTRUCTION: REPLACE THIS COMMENT WITH CONTENT -->');
      expect(result.content).toContain('<!-- TASK: Provide step-by-step setup instructions with screenshots -->');
      expect(result.content).toContain('<!-- PURPOSE: Help new users get up and running quickly -->');
    });

    test('should handle sections without descriptions', () => {
      const templateContent = `---
name: Simple Section Test
description: Test section without description
version: 1.0.0
category: test
---
structure:
  - section: "Quick Reference"
    content_instruction: "List key commands and shortcuts"
`;

      const templatePath = join(testTemplatesDir, 'simple-section.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('simple-section');

      expect(result.content).toContain('## Quick Reference');
      expect(result.content).toContain('<!-- TASK: List key commands and shortcuts -->');
      expect(result.content).not.toContain('<!-- Description:');
    });
  });

  describe('User context integration', () => {
    test('should include user context requirements in generated template', () => {
      const templateContent = `---
name: Context Template
description: Template with user context
version: 1.0.0
category: test
user_context_required:
  project_name: "What is your project name?"
  api_version: "What API version are you documenting?"
  tech_stack: "What is your technology stack?"
---
structure:
  - "# {{project_name}} Documentation"
  - section: "API Version {{api_version}}"
    description: "Documentation for {{tech_stack}} implementation"
    content_instruction: "Document the {{tech_stack}} specific features"
`;

      const templatePath = join(testTemplatesDir, 'context.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('context');

      expect(result.content).toContain('<!-- User Context Required: -->');
      expect(result.content).toContain('<!-- project_name: What is your project name? -->');
      expect(result.content).toContain('<!-- api_version: What API version are you documenting? -->');
      expect(result.content).toContain('<!-- tech_stack: What is your technology stack? -->');
      expect(result.content).toContain('# {{project_name}} Documentation');
      expect(result.content).toContain('## API Version {{api_version}}');
    });

    test('should handle user context substitution when provided', () => {
      const templateContent = `---
name: Substitution Test
description: Template with context substitution
version: 1.0.0
category: test
user_context_required:
  service_name: "What is the service name?"
---
structure:
  - "# {{service_name}} API Guide"
  - section: "{{service_name}} Configuration"
    content_instruction: "Document {{service_name}} setup process"
`;

      const templatePath = join(testTemplatesDir, 'substitution.yml');
      writeFileSync(templatePath, templateContent);

      const userContext = { service_name: 'Payment Service' };
      const result = engine.generateStructuredTemplate('substitution', userContext);

      expect(result.content).toContain('# Payment Service API Guide');
      expect(result.content).toContain('## Payment Service Configuration');
      expect(result.content).toContain('Document Payment Service setup process');
    });
  });

  describe('Complex template conversion', () => {
    test('should convert mixed structure template correctly', () => {
      const templateContent = `---
name: Complex Template
description: Template with mixed elements
version: 1.0.0
category: documentation
sections:
  - overview
  - setup
  - usage
  - troubleshooting
---
structure:
  - "# API Documentation"
  - type: info_panel
    title: "Overview"
    content_instruction: "Provide high-level API description"
  - "## Authentication"
  - section: "API Keys"
    description: "Managing API authentication"
    content_instruction: "Explain API key generation and usage"
  - type: code_block
    language: "curl"
    title: "Example Request"
    content_instruction: "Show a basic API call example"
  - type: warning_panel
    title: "Rate Limits"
    content_instruction: "Document API rate limiting policies"
  - type: expandable
    title: "Advanced Usage"
    content_instruction: "Document advanced API features"
  - "## Troubleshooting"
  - type: expandable
    title: "Common Issues"
    content_instruction: "List frequent problems and solutions"
`;

      const templatePath = join(testTemplatesDir, 'complex.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('complex');

      // Check headers
      expect(result.content).toContain('# API Documentation');
      expect(result.content).toContain('## Authentication');
      expect(result.content).toContain('## API Keys');
      expect(result.content).toContain('## Troubleshooting');

      // Check panels
      expect(result.content).toContain('> ℹ️ **Overview**');
      expect(result.content).toContain('> ⚠️ **Rate Limits**');

      // Check code block
      expect(result.content).toContain('**Example Request**');
      expect(result.content).toContain('```curl');

      // Check expandables
      expect(result.content).toContain('<summary><strong>Advanced Usage</strong></summary>');
      expect(result.content).toContain('<summary><strong>Common Issues</strong></summary>');

      // Check Claude instructions
      expect(result.content).toContain('<!-- TASK: Provide high-level API description -->');
      expect(result.content).toContain('<!-- TASK: Show a basic API call example -->');
      expect(result.content).toContain('<!-- TASK: Document advanced API features -->');
    });
  });

  describe('ADF formatting suggestions', () => {
    test('should include relevant ADF formatting options based on content', () => {
      const templateContent = `---
name: ADF Suggestions Test
description: Test ADF formatting suggestions
version: 1.0.0
category: test
---
structure:
  - section: "Security Guidelines"
    description: "Important security information"
    content_instruction: "Document security best practices"
  - section: "API Examples"
    description: "Code examples and samples"
    content_instruction: "Provide working code examples"
  - section: "Configuration"
    description: "Advanced configuration options"
    content_instruction: "Document complex settings"
`;

      const templatePath = join(testTemplatesDir, 'adf-suggestions.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('adf-suggestions');

      // Should suggest warning panels for security content
      expect(result.content).toContain('~~~panel type=warning title="Security Notice"');
      
      // Should suggest code blocks for examples
      expect(result.content).toContain('Code blocks with ```bash, ```javascript, ```json');
      
      // Should suggest expandables for advanced content
      expect(result.content).toContain('~~~expand title="Advanced Details"');
      
      // Check that suggestions are contextual
      expect(result.content).toContain('<!-- ADF FORMATTING OPTIONS: -->');
    });
  });

  describe('Template validation during conversion', () => {
    test('should validate generated template structure', () => {
      const templateContent = `---
name: Validation Test
description: Test template validation during conversion
version: 1.0.0
category: test
---
structure:
  - "# Valid Template"
  - type: info_panel
    title: "Information"
    content_instruction: "Add content here"
`;

      const templatePath = join(testTemplatesDir, 'validation.yml');
      writeFileSync(templatePath, templateContent);

      const result = engine.generateStructuredTemplate('validation');

      expect(result.validation).toBeDefined();
      expect(result.validation.valid).toBe(true);
      expect(result.validation.errors).toEqual([]);
      expect(result.templatePath).toContain('validation');
    });
  });
});