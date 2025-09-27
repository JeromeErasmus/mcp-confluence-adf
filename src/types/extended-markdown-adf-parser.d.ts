// Type declarations for extended-markdown-adf-parser
// Based on the actual API discovered from the package
declare module 'extended-markdown-adf-parser' {
  export class Parser {
    constructor();
    markdownToAdf(markdown: string): Promise<any>;
    adfToMarkdown(adf: any): string;
    validateMarkdownAsync(markdown: string): Promise<boolean>;
    validateAdf(adf: any): boolean;
    validateMarkdown(markdown: string): boolean;
  }

  export class MarkdownParser {
    constructor();
    parse(markdown: string): any;
    validate(markdown: string): boolean;
  }

  export class EnhancedMarkdownParser {
    constructor();
    parse(markdown: string): Promise<any>;
    parseSync(markdown: string): any;
    validate(markdown: string): boolean;
    stringify(ast: any): string;
  }

  export class ParserError extends Error {}
  export class ConversionError extends Error {}
}