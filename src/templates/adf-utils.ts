import { ValidationResult } from './types.js';

// Import the ADF parser with correct types
let Parser: any = null;

// Initialize parser lazily
async function initializeParser() {
  if (Parser) return;
  
  try {
    const adfParserModule = await import('extended-markdown-adf-parser');
    Parser = adfParserModule.Parser;
  } catch (error) {
    console.error('Warning: extended-markdown-adf-parser not available:', error);
  }
}

/**
 * Validate ADF markdown content syntax and structure
 */
export async function validateADFContent(markdownContent: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  try {
    await initializeParser();
    
    if (!Parser) {
      result.warnings.push('ADF parser not available - skipping ADF validation');
      return result;
    }

    // Create parser instance  
    const parser = new Parser({ enableAdfExtensions: true });
    
    // Validate the markdown content using the parser's validation method
    const isValidMarkdown = parser.validateMarkdown(markdownContent);
    
    if (!isValidMarkdown) {
      result.valid = false;
      result.errors.push('Invalid ADF markdown syntax detected');
    }

    // Check for common ADF markdown syntax issues
    validateADFMarkdownSyntax(markdownContent, result);
    
  } catch (error) {
    result.valid = false;
    result.errors.push(`ADF markdown validation error: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

// Note: We don't need ADF JSON conversion functions for templates
// Templates work with ADF-formatted markdown (.md) files only

/**
 * Validate ADF markdown syntax for common issues
 */
function validateADFMarkdownSyntax(markdownContent: string, result: ValidationResult) {
  const lines = markdownContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Check for malformed panel syntax
    if (line.includes('~~~panel')) {
      if (!line.match(/~~~panel\s+type=(info|warning|success|error|note)/)) {
        result.warnings.push(`Line ${lineNum}: Panel syntax may be malformed - should be "~~~panel type=info title="Title""`);
      }
      if (!line.includes('title=')) {
        result.warnings.push(`Line ${lineNum}: Panel missing title attribute`);
      }
    }
    
    // Check for malformed expand syntax
    if (line.includes('~~~expand')) {
      if (!line.includes('title=')) {
        result.warnings.push(`Line ${lineNum}: Expand section missing title attribute`);
      }
    }
    
    // Check for unclosed ADF blocks
    if (line.startsWith('~~~panel') || line.startsWith('~~~expand')) {
      let foundClosing = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].startsWith('~~~')) {
          foundClosing = true;
          break;
        }
      }
      if (!foundClosing) {
        result.errors.push(`Line ${lineNum}: ADF block not properly closed`);
      }
    }
    
    // Check for proper code block syntax
    if (line.startsWith('```') && line.length > 3) {
      const language = line.substring(3).trim();
      if (!language) {
        result.warnings.push(`Line ${lineNum}: Code block missing language specification`);
      }
    }
  }
}

/**
 * Get ADF entity suggestions for common content types
 */
export function getADFSuggestions(contentType: string, description: string): string[] {
  const suggestions: string[] = [];
  const keywords = description.toLowerCase();

  switch (contentType) {
    case 'introduction':
    case 'overview':
      suggestions.push('~~~panel type=info title="Overview"');
      break;
    case 'warning':
    case 'caution':
      suggestions.push('~~~panel type=warning title="Warning"');
      break;
    case 'success':
    case 'complete':
      suggestions.push('~~~panel type=success title="Success"');
      break;
    case 'note':
    case 'tip':
      suggestions.push('~~~panel type=note title="Note"');
      break;
    case 'details':
    case 'more':
      suggestions.push('~~~expand title="Details"');
      break;
    case 'code':
    case 'example':
      suggestions.push('```language');
      break;
    case 'table':
    case 'data':
      suggestions.push('| Column 1 | Column 2 |');
      break;
  }

  // Add keyword-based suggestions
  if (keywords.includes('security')) {
    suggestions.push('~~~panel type=warning title="Security Notice"');
  }
  if (keywords.includes('example')) {
    suggestions.push('```bash', '```javascript', '```json');
  }
  if (keywords.includes('optional') || keywords.includes('advanced')) {
    suggestions.push('~~~expand title="Advanced Options"');
  }

  return suggestions;
}

/**
 * Format ADF suggestions for template comments
 */
export function formatADFSuggestions(suggestions: string[]): string {
  if (suggestions.length === 0) return '';
  
  return ` Consider using:\n${suggestions.map(s => `- ${s}`).join('\n')}`;
}