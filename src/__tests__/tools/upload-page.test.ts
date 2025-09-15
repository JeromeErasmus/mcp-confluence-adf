import { createUploadPageTool } from '../../tools/upload-page.js';
import { authManager } from '../../auth/manager.js';
import { ConfluenceClient } from '../../client/confluence.js';
import { FileManager } from '../../filemanager/index.js';
import { ADFConverter } from '../../converter/index.js';
import { ToolError } from '../../types/index.js';
import * as fs from 'fs-extra';

// Mock dependencies
jest.mock('../../auth/manager.js');
jest.mock('../../client/confluence.js');
jest.mock('../../filemanager/index.js');
jest.mock('../../converter/index.js');
jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  move: jest.fn()
}));

describe('Upload Page Tool', () => {
  let uploadTool: ReturnType<typeof createUploadPageTool>;
  const mockedAuthManager = authManager as jest.Mocked<typeof authManager>;
  const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;
  const MockedFileManager = FileManager as jest.MockedClass<typeof FileManager>;
  const MockedADFConverter = ADFConverter as jest.MockedClass<typeof ADFConverter>;
  const mockedFs = fs as jest.Mocked<typeof fs>;

  const mockMarkdownContent = `---
pageId: "123456"
title: Test Page
spaceKey: TEST
---

# Test Page

Hello world`;

  const mockADF = {
    version: 1,
    type: "doc" as const,
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: "Hello world" }]
      }
    ]
  };

  const mockCreatedPage = {
    id: '789012',
    title: 'New Test Page',
    space: { key: 'TEST', name: 'Test Space' },
    version: { number: 1, when: '2023-01-01T00:00:00Z' },
    _links: { webui: '/wiki/spaces/TEST/pages/789012/New+Test+Page' }
  };

  const mockUpdatedPage = {
    id: '123456',
    title: 'Updated Test Page',
    space: { key: 'TEST', name: 'Test Space' },
    version: { number: 2, when: '2023-01-01T01:00:00Z' },
    _links: { webui: '/wiki/spaces/TEST/pages/123456/Updated+Test+Page' }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    uploadTool = createUploadPageTool();

    // Default mock implementations
    mockedAuthManager.isAuthenticated.mockReturnValue(true);
    mockedAuthManager.getBaseUrl.mockReturnValue('https://test.atlassian.net');
    (mockedFs.pathExists as jest.Mock).mockResolvedValue(true);
    (mockedFs.readFile as unknown as jest.Mock).mockResolvedValue(mockMarkdownContent);
    (mockedFs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);
    (mockedFs.move as jest.Mock).mockResolvedValue(undefined);
    
    MockedADFConverter.markdownToADF = jest.fn().mockReturnValue({
      adf: mockADF,
      metadata: {
        pageId: '123456',
        title: 'Test Page',
        spaceKey: 'TEST'
      }
    });
    
    MockedFileManager.extractPageIdFromFilename = jest.fn().mockReturnValue('123456');
    MockedFileManager.createManagedFile = jest.fn().mockResolvedValue({
      filePath: '/path/to/789012-new-test-page.md',
      metadataPath: '/path/to/789012-new-test-page.meta.json'
    });
    MockedFileManager.getDisplayPath = jest.fn().mockReturnValue('confluence-downloads/789012-new-test-page.md');

    MockedConfluenceClient.prototype.getContent = jest.fn().mockResolvedValue({
      version: { number: 1 }
    });
    MockedConfluenceClient.prototype.updateContent = jest.fn().mockResolvedValue(mockUpdatedPage);
    MockedConfluenceClient.prototype.createContent = jest.fn().mockResolvedValue(mockCreatedPage);
  });

  describe('tool configuration', () => {
    it('should have correct tool metadata', () => {
      expect(uploadTool.name).toBe('confluence_upload_page');
      expect(uploadTool.title).toBe('Upload Page to Confluence');
      expect(uploadTool.description).toBe('Upload a Markdown file to Confluence, converting to ADF format. Updates existing page if file contains page ID, creates new page otherwise.');
    });

    it('should have correct input schema', () => {
      expect(uploadTool.inputSchema).toEqual({
        type: "object",
        properties: {
          filePath: {
            type: "string",
            description: "Path to the Markdown file to upload"
          },
          spaceKey: {
            type: "string",
            description: "Target space key (required for new pages)"
          },
          parentPageId: {
            type: "string",
            description: "Parent page ID for new pages (optional)"
          }
        },
        required: ["filePath"]
      });
    });
  });

  describe('handler - update existing page', () => {
    it('should update existing page successfully', async () => {
      const params = {
        filePath: '/path/to/123456-test-page.md'
      };

      const result = await uploadTool.handler(params);

      expect(MockedConfluenceClient.prototype.getContent).toHaveBeenCalledWith('123456', ['version']);
      expect(MockedConfluenceClient.prototype.updateContent).toHaveBeenCalledWith('123456', {
        type: 'page',
        title: 'Test Page',
        version: { number: 2 },
        body: {
          atlas_doc_format: {
            value: JSON.stringify(mockADF),
            representation: 'atlas_doc_format'
          }
        }
      });

      expect(result).toEqual({
        content: [{
          type: "text",
          text: `Successfully updated page "Updated Test Page" (ID: 123456)\nView at: https://test.atlassian.net/wiki/spaces/TEST/pages/123456/Updated+Test+Page`
        }]
      });
    });

    it('should extract title from markdown when not in metadata', async () => {
      const markdownWithoutMetadata = `# Extracted Title

Hello world`;

      (mockedFs.readFile as unknown as jest.Mock).mockResolvedValue(markdownWithoutMetadata);
      MockedADFConverter.markdownToADF = jest.fn().mockReturnValue({
        adf: mockADF,
        metadata: undefined
      });

      const params = {
        filePath: '/path/to/123456-test-page.md'
      };

      await uploadTool.handler(params);

      expect(MockedConfluenceClient.prototype.updateContent).toHaveBeenCalledWith('123456', {
        type: 'page',
        title: 'Extracted Title',
        version: { number: 2 },
        body: {
          atlas_doc_format: {
            value: JSON.stringify(mockADF),
            representation: 'atlas_doc_format'
          }
        }
      });
    });

    it('should use "Untitled" when no title found', async () => {
      const markdownWithoutTitle = `Hello world without title`;

      (mockedFs.readFile as unknown as jest.Mock).mockResolvedValue(markdownWithoutTitle);
      MockedADFConverter.markdownToADF = jest.fn().mockReturnValue({
        adf: mockADF,
        metadata: undefined
      });

      const params = {
        filePath: '/path/to/123456-test-page.md'
      };

      await uploadTool.handler(params);

      expect(MockedConfluenceClient.prototype.updateContent).toHaveBeenCalledWith('123456', {
        type: 'page',
        title: 'Untitled',
        version: { number: 2 },
        body: {
          atlas_doc_format: {
            value: JSON.stringify(mockADF),
            representation: 'atlas_doc_format'
          }
        }
      });
    });

    it('should update metadata file after successful update', async () => {
      (mockedFs.pathExists as unknown as jest.Mock).mockImplementation((path) => 
        Promise.resolve(path.toString().includes('test-page'))
      );

      const params = {
        filePath: '/path/to/123456-test-page.md'
      };

      await uploadTool.handler(params);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/path/to/123456-test-page.meta.json',
        JSON.stringify({
          pageId: '123456',
          title: 'Updated Test Page',
          spaceKey: 'TEST',
          originalADF: JSON.stringify(mockADF)
        }, null, 2),
        'utf-8'
      );
    });

    it('should handle update errors gracefully', async () => {
      MockedConfluenceClient.prototype.updateContent = jest.fn().mockRejectedValue(new Error('Update failed'));

      const params = {
        filePath: '/path/to/123456-test-page.md'
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('Failed to update existing page 123456: Update failed');
    });
  });

  describe('handler - create new page', () => {
    beforeEach(() => {
      MockedFileManager.extractPageIdFromFilename = jest.fn().mockReturnValue(null);
      MockedADFConverter.markdownToADF = jest.fn().mockReturnValue({
        adf: mockADF,
        metadata: undefined
      });
    });

    it('should create new page successfully', async () => {
      const markdownContent = `# New Page Title

Hello new world`;
      
      (mockedFs.readFile as unknown as jest.Mock).mockResolvedValue(markdownContent);

      const params = {
        filePath: '/path/to/new-page.md',
        spaceKey: 'TEST'
      };

      const result = await uploadTool.handler(params);

      expect(MockedConfluenceClient.prototype.createContent).toHaveBeenCalledWith({
        type: 'page',
        title: 'New Page Title',
        space: { key: 'TEST' },
        body: {
          atlas_doc_format: {
            value: JSON.stringify(mockADF),
            representation: 'atlas_doc_format'
          }
        }
      });

      expect(result).toEqual({
        content: [{
          type: "text",
          text: `Successfully created new page "New Test Page" (ID: 789012)\nFile renamed to: confluence-downloads/789012-new-test-page.md\nView at: https://test.atlassian.net/wiki/spaces/TEST/pages/789012/New+Test+Page`
        }]
      });
    });

    it('should create new page with parent when specified', async () => {
      const markdownContent = `# Child Page

Hello child world`;
      
      (mockedFs.readFile as unknown as jest.Mock).mockResolvedValue(markdownContent);

      const params = {
        filePath: '/path/to/new-page.md',
        spaceKey: 'TEST',
        parentPageId: 'parent123'
      };

      await uploadTool.handler(params);

      expect(MockedConfluenceClient.prototype.createContent).toHaveBeenCalledWith({
        type: 'page',
        title: 'Child Page',
        space: { key: 'TEST' },
        body: {
          atlas_doc_format: {
            value: JSON.stringify(mockADF),
            representation: 'atlas_doc_format'
          }
        },
        ancestors: [{ id: 'parent123' }]
      });
    });

    it('should throw error when spaceKey is missing for new page', async () => {
      const params = {
        filePath: '/path/to/new-page.md'
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('spaceKey is required when creating a new page');
    });

    it('should handle create errors gracefully', async () => {
      MockedConfluenceClient.prototype.createContent = jest.fn().mockRejectedValue(new Error('Create failed'));

      const markdownContent = `# New Page Title

Hello new world`;
      
      (mockedFs.readFile as unknown as jest.Mock).mockResolvedValue(markdownContent);

      const params = {
        filePath: '/path/to/new-page.md',
        spaceKey: 'TEST'
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('Failed to create new page: Create failed');
    });

    it('should rename file and create metadata after successful creation', async () => {
      const markdownContent = `# New Page Title

Hello new world`;
      
      (mockedFs.readFile as unknown as jest.Mock).mockResolvedValue(markdownContent);

      const params = {
        filePath: '/path/to/new-page.md',
        spaceKey: 'TEST'
      };

      await uploadTool.handler(params);

      expect(mockedFs.move).toHaveBeenCalledWith(
        '/path/to/new-page.md',
        '/path/to/789012-new-test-page.md'
      );

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/path/to/789012-new-test-page.meta.json',
        JSON.stringify({
          pageId: '789012',
          title: 'New Test Page',
          spaceKey: 'TEST',
          originalADF: JSON.stringify(mockADF)
        }, null, 2),
        'utf-8'
      );
    });
  });

  describe('handler - validation and error handling', () => {
    it('should throw error when not authenticated', async () => {
      mockedAuthManager.isAuthenticated.mockReturnValue(false);

      const params = {
        filePath: '/path/to/test.md'
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('Not authenticated. Please authenticate first using confluence_authenticate.');
    });

    it('should throw error when file does not exist', async () => {
      (mockedFs.pathExists as unknown as jest.Mock).mockResolvedValue(false);

      const params = {
        filePath: '/path/to/nonexistent.md'
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('File not found: /path/to/nonexistent.md');
    });

    it('should validate required filePath parameter', async () => {
      const params = {
        filePath: ''
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('Invalid parameters');
    });

    it('should handle missing filePath parameter', async () => {
      const params = {};

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('Invalid parameters');
    });

    it('should handle file read errors', async () => {
      (mockedFs.readFile as unknown as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      const params = {
        filePath: '/path/to/test.md'
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('Failed to upload page: Permission denied');
    });

    it('should handle unknown errors gracefully', async () => {
      (mockedFs.readFile as unknown as jest.Mock).mockRejectedValue('Unknown error');

      const params = {
        filePath: '/path/to/test.md'
      };

      await expect(uploadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(uploadTool.handler(params)).rejects.toThrow('Failed to upload page: Unknown error');
    });
  });
});