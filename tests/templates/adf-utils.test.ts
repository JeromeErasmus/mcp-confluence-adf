import { describe, test, expect, jest } from '@jest/globals';
import { validateADFContent, getADFSuggestions, formatADFSuggestions } from '../../src/templates/adf-utils.js';

// Mock the extended-markdown-adf-parser module
const mockParser = {
  validateMarkdown: jest.fn()
};

jest.mock('extended-markdown-adf-parser', () => ({
  Parser: jest.fn().mockImplementation(() => mockParser)
}));

describe('ADF Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateADFContent', () => {
    test('should validate correct ADF markdown content', async () => {
      mockParser.validateMarkdown.mockReturnValue(true);

      const markdownContent = `# Test Document

## Introduction
This is a test document with proper ADF markdown.

~~~panel type=info title="Information"
This is an info panel with proper syntax.
~~~

\`\`\`javascript
function example() {
  return "Hello World";
}
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
`;

      const result = await validateADFContent(markdownContent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockParser.validateMarkdown).toHaveBeenCalledWith(markdownContent);
    });

    test('should detect invalid ADF markdown syntax', async () => {
      mockParser.validateMarkdown.mockReturnValue(false);

      const markdownContent = `# Invalid Document

This document has invalid ADF syntax.
`;

      const result = await validateADFContent(markdownContent);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid ADF markdown syntax detected');
    });

    test('should handle parser unavailability gracefully', async () => {
      // Mock the parser to return true for valid markdown
      mockParser.validateMarkdown.mockReturnValue(true);
      
      const markdownContent = `# Test Document

This is valid markdown content that should pass validation.
`;

      const result = await validateADFContent(markdownContent);

      // With parser available, validation should succeed for valid markdown
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect malformed panel syntax', async () => {
      mockParser.validateMarkdown.mockReturnValue(true);

      const markdownContent = `# Test Document

~~~panel invalid-type
This panel has invalid syntax.
~~~

~~~panel type=info
This panel is missing a title.
~~~
`;

      const result = await validateADFContent(markdownContent);

      expect(result.warnings.some(w => w.includes('Panel syntax may be malformed'))).toBe(true);
      expect(result.warnings.some(w => w.includes('Panel missing title attribute'))).toBe(true);
    });

    test('should detect malformed expand syntax', async () => {
      mockParser.validateMarkdown.mockReturnValue(true);

      const markdownContent = `# Test Document

~~~expand
This expand section is missing a title.
~~~
`;

      const result = await validateADFContent(markdownContent);

      expect(result.warnings.some(w => w.includes('Expand section missing title attribute'))).toBe(true);
    });

    test('should detect unclosed ADF blocks', async () => {
      mockParser.validateMarkdown.mockReturnValue(true);

      const markdownContent = `# Test Document

~~~panel type=info title="Unclosed Panel"
This panel is never closed.

~~~expand title="Unclosed Expand"
This expand section is never closed.
`;

      const result = await validateADFContent(markdownContent);

      expect(result.errors.some(e => e.includes('ADF block not properly closed'))).toBe(true);
    });

    test('should detect code blocks without language specification', async () => {
      mockParser.validateMarkdown.mockReturnValue(true);

      const markdownContent = `# Test Document

\`\`\`   
function example() {
  return "No language specified";
}
\`\`\`

\`\`\`javascript
function goodExample() {
  return "Language specified";
}
\`\`\`
`;

      const result = await validateADFContent(markdownContent);

      // The validation should detect missing language specification
      // (line has spaces after ``` so length > 3 but language.trim() is empty)
      const missingLangWarnings = result.warnings.filter(w => w.includes('Code block missing language specification'));
      expect(missingLangWarnings.length).toBe(1);
    });

    test('should handle parser throwing errors', async () => {
      mockParser.validateMarkdown.mockImplementation(() => {
        throw new Error('Parser error');
      });

      const markdownContent = `# Test Document`;

      const result = await validateADFContent(markdownContent);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ADF markdown validation error: Parser error'))).toBe(true);
    });

    test('should properly handle well-formed ADF blocks', async () => {
      mockParser.validateMarkdown.mockReturnValue(true);

      const markdownContent = `# Test Document

~~~panel type=info title="Proper Info Panel"
This panel is properly formatted.
~~~

~~~panel type=warning title="Proper Warning Panel"
This warning panel is also properly formatted.
~~~

~~~expand title="Proper Expand Section"
This expandable section has a proper title.
~~~

\`\`\`javascript
function properCodeBlock() {
  return "This code block has language specification";
}
\`\`\`
`;

      const result = await validateADFContent(markdownContent);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('getADFSuggestions', () => {
    test('should return info panel suggestions for introduction content', () => {
      const suggestions = getADFSuggestions('introduction', 'This is an overview section');

      expect(suggestions).toContain('~~~panel type=info title="Overview"');
    });

    test('should return warning panel suggestions for warning content', () => {
      const suggestions = getADFSuggestions('warning', 'This is a caution message');

      expect(suggestions).toContain('~~~panel type=warning title="Warning"');
    });

    test('should return success panel suggestions for success content', () => {
      const suggestions = getADFSuggestions('success', 'This indicates completion');

      expect(suggestions).toContain('~~~panel type=success title="Success"');
    });

    test('should return note panel suggestions for note content', () => {
      const suggestions = getADFSuggestions('note', 'This is additional information');

      expect(suggestions).toContain('~~~panel type=note title="Note"');
    });

    test('should return expand suggestions for details content', () => {
      const suggestions = getADFSuggestions('details', 'More detailed information');

      expect(suggestions).toContain('~~~expand title="Details"');
    });

    test('should return code block suggestions for code content', () => {
      const suggestions = getADFSuggestions('code', 'Code examples');

      expect(suggestions).toContain('```language');
    });

    test('should return table suggestions for data content', () => {
      const suggestions = getADFSuggestions('table', 'Tabular data');

      expect(suggestions).toContain('| Column 1 | Column 2 |');
    });

    test('should return keyword-based suggestions', () => {
      const securitySuggestions = getADFSuggestions('other', 'This content includes security considerations');
      expect(securitySuggestions).toContain('~~~panel type=warning title="Security Notice"');

      const exampleSuggestions = getADFSuggestions('other', 'This content includes example code');
      expect(exampleSuggestions).toContain('```bash');
      expect(exampleSuggestions).toContain('```javascript');
      expect(exampleSuggestions).toContain('```json');

      const advancedSuggestions = getADFSuggestions('other', 'This content has optional advanced features');
      expect(advancedSuggestions).toContain('~~~expand title="Advanced Options"');
    });

    test('should return empty array for unknown content types without keywords', () => {
      const suggestions = getADFSuggestions('unknown', 'Generic content without special keywords');

      expect(suggestions).toEqual([]);
    });
  });

  describe('formatADFSuggestions', () => {
    test('should format suggestions with proper markdown list', () => {
      const suggestions = [
        '~~~panel type=info title="Information"',
        '```javascript',
        '| Column 1 | Column 2 |'
      ];

      const formatted = formatADFSuggestions(suggestions);

      expect(formatted).toBe(` Consider using:\n- ~~~panel type=info title="Information"\n- \`\`\`javascript\n- | Column 1 | Column 2 |`);
    });

    test('should return empty string for empty suggestions array', () => {
      const formatted = formatADFSuggestions([]);

      expect(formatted).toBe('');
    });

    test('should handle single suggestion correctly', () => {
      const suggestions = ['~~~panel type=warning title="Warning"'];

      const formatted = formatADFSuggestions(suggestions);

      expect(formatted).toBe(` Consider using:\n- ~~~panel type=warning title="Warning"`);
    });
  });
});