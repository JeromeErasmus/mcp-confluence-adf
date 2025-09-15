// Core types
export interface ManagedFile {
  filePath: string;
  metadataPath: string;
}

export interface FileManagerConfig {
  baseDirectory?: string;
}

export interface AuthCredentials {
  baseUrl: string;
  email: string;
  apiToken: string;
}

export interface ConfluenceContent {
  id: string;
  type: string;
  title: string;
  space: {
    key: string;
    name: string;
  };
  body?: {
    atlas_doc_format?: {
      value: string;
      representation: string;
    };
  };
  version: {
    number: number;
    when: string;
  };
  _links: {
    webui: string;
  };
}

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  description?: {
    plain?: {
      value: string;
    };
  };
  _links: {
    webui: string;
  };
}

export interface FileMetadata {
  pageId: string;
  title: string;
  spaceKey: string;
  originalADF: string;
}

export interface ADFNode {
  type: string;
  content?: ADFNode[];
  attrs?: Record<string, any>;
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
  }>;
  text?: string;
}

export interface ADFDocument {
  version: number;
  type: "doc";
  content: ADFNode[];
}

// Tool types
export interface ToolHandler<T = any> {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (params: { [x: string]: any }) => Promise<{
    content: Array<{
      type: "text";
      text: string;
    }>;
    isError?: boolean;
  }>;
}

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}