import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { TemplateEngine } from '../../src/templates/engine.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('YAML Template Parsing', () => {
  let engine: TemplateEngine;
  let testTemplatesDir: string;
  let testGeneratedDir: string;

  beforeEach(() => {
    testTemplatesDir = join(process.cwd(), 'tests', 'fixtures', 'yaml-parsing');
    testGeneratedDir = join(process.cwd(), 'tests', 'fixtures', 'yaml-parsing-generated');
    
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

  describe('YAML frontmatter parsing', () => {
    test('should parse complete YAML frontmatter correctly', () => {
      const templateContent = `---
name: Complete Template
description: A template with all metadata fields
version: 2.1.0
category: documentation
output_type: structured_template
sections:
  - introduction
  - setup
  - examples
  - troubleshooting
user_context_required:
  service_name: "What is the service name?"
  version: "What version are you documenting?"
---
structure:
  - "# {{service_name}} Documentation"
  - type: info_panel
    title: "Version {{version}}"
    content_instruction: "Document version-specific information"
`;

      const templatePath = join(testTemplatesDir, 'complete.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.metadata.name).toBe('Complete Template');
      expect(parsed.metadata.description).toBe('A template with all metadata fields');
      expect(parsed.metadata.version).toBe('2.1.0');
      expect(parsed.metadata.category).toBe('documentation');
      expect(parsed.metadata.output_type).toBe('structured_template');
      expect(parsed.metadata.sections).toEqual(['introduction', 'setup', 'examples', 'troubleshooting']);
      expect(parsed.user_context_required).toEqual({
        service_name: "What is the service name?",
        version: "What version are you documenting?"
      });
    });

    test('should handle minimal YAML frontmatter', () => {
      const templateContent = `---
name: Minimal Template
description: Basic template
version: 1.0.0
category: test
---
structure:
  - "# Simple Header"
`;

      const templatePath = join(testTemplatesDir, 'minimal.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.metadata.name).toBe('Minimal Template');
      expect(parsed.metadata.description).toBe('Basic template');
      expect(parsed.user_context_required).toBeUndefined();
      expect(parsed.metadata.sections).toBeUndefined();
    });

    test('should handle YAML arrays in sections', () => {
      const templateContent = `---
name: Array Template
description: Template with array fields
version: 1.0.0
category: test
sections:
  - getting-started
  - "advanced usage"
  - troubleshooting
---
structure:
  - "# Documentation"
`;

      const templatePath = join(testTemplatesDir, 'arrays.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.metadata.sections).toEqual(['getting-started', 'advanced usage', 'troubleshooting']);
    });

    test('should handle nested YAML objects', () => {
      const templateContent = `---
name: Nested Template
description: Template with nested metadata
version: 1.0.0
category: test
user_context_required:
  project_name: "What is your project name?"
  project_type: "What type of project is this?"
  api_version: "What API version?"
  auth_method: "What authentication method?"
---
structure:
  - "# {{project_name}}"
`;

      const templatePath = join(testTemplatesDir, 'nested.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.user_context_required?.project_name).toBe("What is your project name?");
      expect(parsed.user_context_required?.project_type).toBe("What type of project is this?");
      expect(parsed.user_context_required?.api_version).toBe("What API version?");
      expect(parsed.user_context_required?.auth_method).toBe("What authentication method?");
    });
  });

  describe('YAML structure parsing', () => {
    test('should parse simple string elements', () => {
      const templateContent = `---
name: Simple Structure
description: Template with simple elements
version: 1.0.0
category: test
---
structure:
  - "# Main Header"
  - "## Subheader"
  - "This is a paragraph."
  - "Another paragraph with **bold** text."
`;

      const templatePath = join(testTemplatesDir, 'simple-structure.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.structure).toHaveLength(4);
      expect(parsed.structure[0]).toBe('# Main Header');
      expect(parsed.structure[1]).toBe('## Subheader');
      expect(parsed.structure[2]).toBe('This is a paragraph.');
      expect(parsed.structure[3]).toBe('Another paragraph with **bold** text.');
    });

    test('should parse ADF component objects', () => {
      const templateContent = `---
name: ADF Components
description: Template with ADF-specific components
version: 1.0.0
category: test
---
structure:
  - type: info_panel
    title: "Information"
    content_instruction: "Add important info here"
    purpose: "Highlight key information"
  - type: warning_panel
    title: "Warning"
    content_instruction: "Add warning text"
  - type: success_panel
    title: "Success"
    content_instruction: "Add success message"
  - type: note_panel
    title: "Note"
    content_instruction: "Add additional notes"
`;

      const templatePath = join(testTemplatesDir, 'adf-components.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.structure).toHaveLength(4);
      
      const infoPanel = parsed.structure[0] as any;
      expect(infoPanel.type).toBe('info_panel');
      expect(infoPanel.title).toBe('Information');
      expect(infoPanel.content_instruction).toBe('Add important info here');
      expect(infoPanel.purpose).toBe('Highlight key information');

      const warningPanel = parsed.structure[1] as any;
      expect(warningPanel.type).toBe('warning_panel');
      expect(warningPanel.title).toBe('Warning');
    });

    test('should parse section objects', () => {
      const templateContent = `---
name: Section Template
description: Template with section objects
version: 1.0.0
category: test
---
structure:
  - section: "Getting Started"
    description: "Initial setup and configuration"
    content_instruction: "Provide step-by-step setup instructions"
    purpose: "Help users get up and running quickly"
  - section: "Advanced Usage"
    description: "Complex scenarios and edge cases"
    content_instruction: "Document advanced features and configurations"
`;

      const templatePath = join(testTemplatesDir, 'sections.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.structure).toHaveLength(2);
      
      const firstSection = parsed.structure[0] as any;
      expect(firstSection.section).toBe('Getting Started');
      expect(firstSection.description).toBe('Initial setup and configuration');
      expect(firstSection.content_instruction).toBe('Provide step-by-step setup instructions');
      expect(firstSection.purpose).toBe('Help users get up and running quickly');
    });

    test('should parse code block objects', () => {
      const templateContent = `---
name: Code Block Template
description: Template with code blocks
version: 1.0.0
category: test
---
structure:
  - type: code_block
    language: "javascript"
    title: "Example Function"
    content_instruction: "Show a basic function example"
  - type: code_block
    language: "bash"
    title: "Installation Commands"
    content_instruction: "Provide installation steps"
    purpose: "Guide users through setup"
`;

      const templatePath = join(testTemplatesDir, 'code-blocks.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.structure).toHaveLength(2);
      
      const jsBlock = parsed.structure[0] as any;
      expect(jsBlock.type).toBe('code_block');
      expect(jsBlock.language).toBe('javascript');
      expect(jsBlock.title).toBe('Example Function');
      expect(jsBlock.content_instruction).toBe('Show a basic function example');

      const bashBlock = parsed.structure[1] as any;
      expect(bashBlock.type).toBe('code_block');
      expect(bashBlock.language).toBe('bash');
      expect(bashBlock.purpose).toBe('Guide users through setup');
    });

    test('should parse expandable objects', () => {
      const templateContent = `---
name: Expandable Template
description: Template with expandable sections
version: 1.0.0
category: test
---
structure:
  - type: expandable
    title: "Advanced Configuration"
    content_instruction: "Document complex configuration options"
    purpose: "Hide advanced details to reduce clutter"
  - type: expandable
    title: "Troubleshooting"
    content_instruction: "List common problems and solutions"
    collapsed_by_default: true
`;

      const templatePath = join(testTemplatesDir, 'expandable.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.structure).toHaveLength(2);
      
      const configExpand = parsed.structure[0] as any;
      expect(configExpand.type).toBe('expandable');
      expect(configExpand.title).toBe('Advanced Configuration');
      expect(configExpand.purpose).toBe('Hide advanced details to reduce clutter');

      const troubleshootExpand = parsed.structure[1] as any;
      expect(troubleshootExpand.collapsed_by_default).toBe(true);
    });

    test('should parse mixed structure elements', () => {
      const templateContent = `---
name: Mixed Template
description: Template with mixed element types
version: 1.0.0
category: test
---
structure:
  - "# API Documentation"
  - type: info_panel
    title: "Overview"
    content_instruction: "Provide API overview"
  - "## Authentication"
  - section: "API Keys"
    description: "How to obtain and use API keys"
    content_instruction: "Document API key management"
  - type: code_block
    language: "curl"
    title: "Example Request"
    content_instruction: "Show a sample API call"
  - "## Rate Limits"
  - type: warning_panel
    title: "Important"
    content_instruction: "Document rate limit policies"
`;

      const templatePath = join(testTemplatesDir, 'mixed.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.structure).toHaveLength(7);
      expect(parsed.structure[0]).toBe('# API Documentation');
      expect((parsed.structure[1] as any).type).toBe('info_panel');
      expect(parsed.structure[2]).toBe('## Authentication');
      expect((parsed.structure[3] as any).section).toBe('API Keys');
      expect((parsed.structure[4] as any).type).toBe('code_block');
      expect(parsed.structure[5]).toBe('## Rate Limits');
      expect((parsed.structure[6] as any).type).toBe('warning_panel');
    });
  });

  describe('YAML syntax error handling', () => {
    test('should handle invalid YAML syntax', () => {
      const templateContent = `---
name: Invalid YAML
description: Template with syntax errors
version: 1.0.0
category: test
user_context_required:
  project_name: "What is the project name?"
  - invalid_array_in_object
---
structure:
  - "# Test"
`;

      const templatePath = join(testTemplatesDir, 'invalid-yaml.yml');
      writeFileSync(templatePath, templateContent);

      expect(() => engine.parseTemplate(templatePath)).toThrow();
    });

    test('should handle malformed frontmatter delimiters', () => {
      const templateContent = `--
name: Bad Delimiters
description: Missing frontmatter delimiter
version: 1.0.0
category: test
---
structure:
  - "# Test"
`;

      const templatePath = join(testTemplatesDir, 'bad-delimiters.yml');
      writeFileSync(templatePath, templateContent);

      expect(() => engine.parseTemplate(templatePath)).toThrow('Template must contain YAML frontmatter');
    });

    test('should handle empty structure array', () => {
      const templateContent = `---
name: Empty Structure
description: Template with empty structure
version: 1.0.0
category: test
---
structure: []
`;

      const templatePath = join(testTemplatesDir, 'empty-structure.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);
      expect(parsed.structure).toEqual([]);
    });

    test('should handle missing structure field', () => {
      const templateContent = `---
name: No Structure
description: Template missing structure field
version: 1.0.0
category: test
---
# No structure field defined
`;

      const templatePath = join(testTemplatesDir, 'no-structure.yml');
      writeFileSync(templatePath, templateContent);

      expect(() => engine.parseTemplate(templatePath)).toThrow();
    });
  });

  describe('Template file extensions', () => {
    test('should parse .yml files', () => {
      const templateContent = `---
name: YAML File
description: Template with .yml extension
version: 1.0.0
category: test
---
structure:
  - "# YML Template"
`;

      const templatePath = join(testTemplatesDir, 'test.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);
      expect(parsed.metadata.name).toBe('YAML File');
    });

    test('should parse .yaml files', () => {
      const templateContent = `---
name: YAML File Extended
description: Template with .yaml extension  
version: 1.0.0
category: test
---
structure:
  - "# YAML Template"
`;

      const templatePath = join(testTemplatesDir, 'test.yaml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);
      expect(parsed.metadata.name).toBe('YAML File Extended');
    });
  });

  describe('Real-world template examples', () => {
    test('should parse getting started template structure', () => {
      const templateContent = `---
name: Getting Started Guide
description: Complete getting started template
version: 1.2.0
category: user-guide
sections:
  - introduction
  - prerequisites
  - installation
  - basic-usage
  - troubleshooting
user_context_required:
  project_name: "What is the name of your project?"
  main_technology: "What is the main technology stack?"
---
structure:
  - "# Getting Started with {{project_name}}"
  - type: info_panel
    title: "Welcome"
    content_instruction: "Create a welcoming introduction for {{project_name}}"
    purpose: "Set positive tone and provide overview"
  - "## Prerequisites"
  - section: "Requirements"
    description: "System requirements and dependencies"
    content_instruction: "List requirements for {{main_technology}}"
  - "## Installation"
  - type: code_block
    language: "bash"
    title: "Quick Install"
    content_instruction: "Provide installation command for {{project_name}}"
  - type: success_panel
    title: "Installation Complete"
    content_instruction: "Confirm successful installation"
  - "## Basic Usage"
  - section: "First Steps"
    description: "Basic usage example"
    content_instruction: "Show Hello World example for {{project_name}}"
  - type: expandable
    title: "Troubleshooting"
    content_instruction: "List common issues and solutions"
`;

      const templatePath = join(testTemplatesDir, 'getting-started.yml');
      writeFileSync(templatePath, templateContent);

      const parsed = engine.parseTemplate(templatePath);

      expect(parsed.metadata.name).toBe('Getting Started Guide');
      expect(parsed.metadata.sections).toHaveLength(5);
      expect(parsed.user_context_required?.project_name).toBeTruthy();
      expect(parsed.structure).toHaveLength(10);
      
      // Verify structure contains expected elements
      expect(parsed.structure[0]).toBe('# Getting Started with {{project_name}}');
      expect((parsed.structure[1] as any).type).toBe('info_panel');
      expect((parsed.structure[5] as any).type).toBe('code_block');
      expect((parsed.structure[6] as any).type).toBe('success_panel');
      expect((parsed.structure[9] as any).type).toBe('expandable');
    });
  });
});