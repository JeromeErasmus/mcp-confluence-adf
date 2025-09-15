import { ADFConverter } from '../../converter/index.js';
import { ADFDocument } from '../../types/index.js';

describe('ADFConverter', () => {
  describe('adfToMarkdown', () => {
    it('should convert simple paragraph', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello world' }
            ]
          }
        ]
      };

      const markdown = ADFConverter.adfToMarkdown(adf);
      expect(markdown).toBe('Hello world');
    });

    it('should convert headings', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Heading 1' }]
          },
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Heading 2' }]
          }
        ]
      };

      const markdown = ADFConverter.adfToMarkdown(adf);
      expect(markdown).toBe('# Heading 1\n\n## Heading 2');
    });

    it('should convert text with marks', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { 
                type: 'text', 
                text: 'Bold text',
                marks: [{ type: 'strong' }]
              },
              { type: 'text', text: ' and ' },
              {
                type: 'text',
                text: 'italic text',
                marks: [{ type: 'em' }]
              }
            ]
          }
        ]
      };

      const markdown = ADFConverter.adfToMarkdown(adf);
      expect(markdown).toBe('**Bold text** and *italic text*');
    });

    it('should convert code blocks', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'javascript' },
            content: [
              { type: 'text', text: 'console.log("Hello world");' }
            ]
          }
        ]
      };

      const markdown = ADFConverter.adfToMarkdown(adf);
      expect(markdown).toBe('```javascript\nconsole.log("Hello world");\n```');
    });

    it('should convert bullet lists', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'bulletList',
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Item 1' }]
                  }
                ]
              },
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Item 2' }]
                  }
                ]
              }
            ]
          }
        ]
      };

      const markdown = ADFConverter.adfToMarkdown(adf);
      expect(markdown).toBe('- Item 1\n- Item 2');
    });

    it('should convert tables', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableHeader',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Header 1' }]
                      }
                    ]
                  },
                  {
                    type: 'tableHeader',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Header 2' }]
                      }
                    ]
                  }
                ]
              },
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableCell',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Cell 1' }]
                      }
                    ]
                  },
                  {
                    type: 'tableCell',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: 'Cell 2' }]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const markdown = ADFConverter.adfToMarkdown(adf);
      expect(markdown).toBe('| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |');
    });

    it('should convert panels', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'panel',
            attrs: { panelType: 'info' },
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'This is an info panel' }]
              }
            ]
          }
        ]
      };

      const markdown = ADFConverter.adfToMarkdown(adf);
      expect(markdown).toBe('> ℹ️ **Info:** This is an info panel');
    });

    it('should include metadata as YAML frontmatter', () => {
      const adf: ADFDocument = {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }]
          }
        ]
      };

      const metadata = {
        pageId: '123',
        title: 'Test Page',
        spaceKey: 'TEST'
      };

      const markdown = ADFConverter.adfToMarkdown(adf, metadata);
      expect(markdown).toContain('---');
      expect(markdown).toContain('pageId: "123"');
      expect(markdown).toContain('title: Test Page');
      expect(markdown).toContain('spaceKey: TEST');
      expect(markdown).toContain('Hello world');
    });
  });

  describe('markdownToADF', () => {
    it('should convert simple paragraph', () => {
      const markdown = 'Hello world';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf).toEqual({
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }]
          }
        ]
      });
    });

    it('should convert headings', () => {
      const markdown = '# Heading 1\n\n## Heading 2';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content).toHaveLength(2);
      expect(result.adf.content[0]).toEqual({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: 'Heading 1' }]
      });
      expect(result.adf.content[1]).toEqual({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Heading 2' }]
      });
    });

    it('should convert text with marks', () => {
      const markdown = '**Bold text** and *italic text* and `code text`';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Bold text',
            marks: [{ type: 'strong' }]
          },
          { type: 'text', text: ' and ' },
          {
            type: 'text',
            text: 'italic text',
            marks: [{ type: 'em' }]
          },
          { type: 'text', text: ' and ' },
          {
            type: 'text',
            text: 'code text',
            marks: [{ type: 'code' }]
          }
        ]
      });
    });

    it('should convert links', () => {
      const markdown = '[Link text](https://example.com)';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0]).toEqual({
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Link text',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }]
          }
        ]
      });
    });

    it('should convert code blocks', () => {
      const markdown = '```javascript\nconsole.log("Hello world");\n```';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0]).toEqual({
        type: 'codeBlock',
        attrs: { language: 'javascript' },
        content: [{ type: 'text', text: 'console.log("Hello world");' }]
      });
    });

    it('should convert bullet lists', () => {
      const markdown = '- Item 1\n- Item 2';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0]).toEqual({
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 1' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 2' }]
              }
            ]
          }
        ]
      });
    });

    it('should convert ordered lists', () => {
      const markdown = '1. Item 1\n2. Item 2';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0]).toEqual({
        type: 'orderedList',
        content: [
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 1' }]
              }
            ]
          },
          {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Item 2' }]
              }
            ]
          }
        ]
      });
    });

    it('should convert tables', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0].type).toBe('table');
      expect(result.adf.content[0].content).toHaveLength(2);
      
      // Check header row
      expect(result.adf.content[0].content![0]).toEqual({
        type: 'tableRow',
        content: [
          {
            type: 'tableHeader',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Header 1' }]
              }
            ]
          },
          {
            type: 'tableHeader',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Header 2' }]
              }
            ]
          }
        ]
      });
    });

    it('should convert panels', () => {
      const markdown = '> ℹ️ **Info:** This is an info panel';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0]).toEqual({
        type: 'panel',
        attrs: { panelType: 'info' },
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'This is an info panel' }]
          }
        ]
      });
    });

    it('should convert different panel types', () => {
      const testCases = [
        { icon: 'ℹ️', type: 'info' },
        { icon: '⚠️', type: 'warning' },
        { icon: '❌', type: 'error' },
        { icon: '✅', type: 'success' },
        { icon: '📝', type: 'note' }
      ];

      testCases.forEach(({ icon, type }) => {
        const markdown = `> ${icon} **${type.charAt(0).toUpperCase() + type.slice(1)}:** Test content`;
        const result = ADFConverter.markdownToADF(markdown);

        expect(result.adf.content[0]).toEqual({
          type: 'panel',
          attrs: { panelType: type },
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Test content' }]
            }
          ]
        });
      });
    });

    it('should convert horizontal rules', () => {
      const markdown = '---';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content[0]).toEqual({
        type: 'rule'
      });
    });

    it('should parse YAML frontmatter', () => {
      const markdown = `---
pageId: "123"
title: Test Page
spaceKey: TEST
---

Hello world`;

      const result = ADFConverter.markdownToADF(markdown);

      expect(result.metadata).toEqual({
        pageId: '123',
        title: 'Test Page',
        spaceKey: 'TEST'
      });

      expect(result.adf.content[0]).toEqual({
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello world' }]
      });
    });

    it('should handle empty content', () => {
      const markdown = '';
      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf).toEqual({
        version: 1,
        type: 'doc',
        content: []
      });
    });

    it('should handle mixed content', () => {
      const markdown = `# Title

This is a **paragraph** with *emphasis*.

- List item 1
- List item 2

\`\`\`javascript
console.log("code");
\`\`\`

> ℹ️ **Info:** This is important`;

      const result = ADFConverter.markdownToADF(markdown);

      expect(result.adf.content).toHaveLength(5);
      expect(result.adf.content[0].type).toBe('heading');
      expect(result.adf.content[1].type).toBe('paragraph');
      expect(result.adf.content[2].type).toBe('bulletList');
      expect(result.adf.content[3].type).toBe('codeBlock');
      expect(result.adf.content[4].type).toBe('panel');
    });
  });

  describe('bidirectional conversion', () => {
    it('should maintain content through round-trip conversion', () => {
      const originalMarkdown = `# Test Document

This is a **test** document with *various* elements.

## Features

- Bold and italic text
- Code blocks
- Tables
- Panels

\`\`\`javascript
const test = "hello world";
\`\`\`

| Header 1 | Header 2 |
| --- | --- |
| Cell 1 | Cell 2 |

> ℹ️ **Info:** This is an information panel`;

      // Convert to ADF and back to Markdown
      const adfResult = ADFConverter.markdownToADF(originalMarkdown);
      const backToMarkdown = ADFConverter.adfToMarkdown(adfResult.adf);

      // Should maintain core structure (some formatting differences are expected)
      expect(backToMarkdown).toContain('# Test Document');
      expect(backToMarkdown).toContain('## Features');
      expect(backToMarkdown).toContain('**test**');
      expect(backToMarkdown).toContain('*various*');
      expect(backToMarkdown).toContain('```javascript');
      expect(backToMarkdown).toContain('| Header 1 | Header 2 |');
      expect(backToMarkdown).toContain('> ℹ️ **Info:**');
    });
  });
});