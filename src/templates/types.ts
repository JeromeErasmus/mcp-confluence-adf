import { z } from 'zod';

/**
 * Template Generation System - Types
 * 
 * WORKFLOW OVERVIEW:
 * 1. YAML Template Definition → Structured content plan
 * 2. Template Engine → Intermediate .md file with Claude instruction comments
 * 3. Claude AI Processing → Final publication-ready ADF markdown
 * 4. Confluence Upload → Live documentation
 */

// Template validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Generated intermediate template output (contains Claude instruction comments)
export interface GeneratedTemplate {
  success: boolean;
  templatePath: string;
  content: string; // Intermediate markdown with Claude instruction comments
  validation: ValidationResult;
}

// Template list item
export interface TemplateListItem {
  name: string;
  description: string;
  category: string;
  sections: string[];
  path: string;
}

// Error responses for MCP tools
export interface TemplateError {
  success: false;
  error: string;
  message: string;
  suggestions?: string[];
}

// Success responses for MCP tools
export interface TemplateSuccess {
  success: true;
  [key: string]: any;
}

export type TemplateResult = TemplateSuccess | TemplateError;

// Template generation parameters
export interface GenerateTemplateParams {
  templateName: string;
  outputPath?: string;
  userContext?: Record<string, string>;
}

// Template validation parameters
export interface ValidateTemplateParams {
  templatePath: string;
}

// Available templates response
export interface ListTemplatesResponse {
  templates: TemplateListItem[];
}

// ADF entity suggestions
export const ADF_ENTITIES = {
  INFO_PANEL: 'panel type=info',
  WARNING_PANEL: 'panel type=warning',
  SUCCESS_PANEL: 'panel type=success',
  NOTE_PANEL: 'panel type=note',
  EXPANDABLE: 'expand',
  CODE_BLOCK: 'code block',
  TABLE: 'markdown table'
} as const;

// Template categories
export const TEMPLATE_CATEGORIES = {
  API: 'api',
  USER_GUIDE: 'user-guide',
  TECHNICAL: 'technical',
  PROCESS: 'process',
  TROUBLESHOOTING: 'troubleshooting'
} as const;

// Common section types
export const SECTION_TYPES = {
  GETTING_STARTED: 'getting_started',
  AUTHENTICATION: 'authentication',
  ENDPOINTS: 'endpoints',
  EXAMPLES: 'examples',
  TROUBLESHOOTING: 'troubleshooting',
  CONFIGURATION: 'configuration',
  INSTALLATION: 'installation'
} as const;