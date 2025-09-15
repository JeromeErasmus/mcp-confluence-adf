import { createDownloadPageTool } from '../../tools/download-page.js';
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
  writeFile: jest.fn(),
  pathExists: jest.fn(),
  readFile: jest.fn(),
  move: jest.fn()
}));

describe('Download Page Tool', () => {
  let downloadTool: ReturnType<typeof createDownloadPageTool>;
  const mockedAuthManager = authManager as jest.Mocked<typeof authManager>;
  const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;
  const MockedFileManager = FileManager as jest.MockedClass<typeof FileManager>;
  const MockedADFConverter = ADFConverter as jest.MockedClass<typeof ADFConverter>;
  const mockedFs = fs as jest.Mocked<typeof fs>;

  const mockPage = {
    id: '123456',
    title: 'Test Page',
    space: { key: 'TEST', name: 'Test Space' },
    version: { number: 1, when: '2023-01-01T00:00:00Z' },
    _links: { webui: '/wiki/spaces/TEST/pages/123456/Test+Page' },
    body: {
      atlas_doc_format: {
        value: JSON.stringify({
          version: 1,
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Hello world" }]
            }
          ]
        }),
        representation: 'atlas_doc_format'
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    downloadTool = createDownloadPageTool();

    // Default mock implementations
    mockedAuthManager.isAuthenticated.mockReturnValue(true);
    MockedConfluenceClient.prototype.getContent = jest.fn().mockResolvedValue(mockPage);
    MockedFileManager.createManagedFile = jest.fn().mockResolvedValue({
      filePath: '/path/to/123456-test-page.md',
      metadataPath: '/path/to/123456-test-page.meta.json'
    });
    MockedFileManager.getDisplayPath = jest.fn().mockReturnValue('confluence-downloads/123456-test-page.md');
    MockedADFConverter.adfToMarkdown = jest.fn().mockReturnValue('# Test Page\n\nHello world');
    (mockedFs.writeFile as unknown as jest.Mock).mockResolvedValue(undefined);
  });

  describe('tool configuration', () => {
    it('should have correct tool metadata', () => {
      expect(downloadTool.name).toBe('confluence_download_page');
      expect(downloadTool.title).toBe('Download Confluence Page');
      expect(downloadTool.description).toBe('Download a Confluence page as Markdown with metadata, converting from ADF format.');
    });

    it('should have correct input schema', () => {
      expect(downloadTool.inputSchema).toEqual({
        type: "object",
        properties: {
          pageId: {
            type: "string",
            description: "Confluence page ID to download"
          },
          targetDirectory: {
            type: "string",
            description: "Target directory for downloaded file (optional)"
          }
        },
        required: ["pageId"]
      });
    });
  });

  describe('handler', () => {
    it('should download page successfully', async () => {
      const params = {
        pageId: '123456'
      };

      const result = await downloadTool.handler(params);

      expect(MockedConfluenceClient.prototype.getContent).toHaveBeenCalledWith('123456', ['body.atlas_doc_format', 'space', 'version']);
      expect(MockedFileManager.createManagedFile).toHaveBeenCalledWith('123456', 'Test Page', undefined);
      expect(MockedADFConverter.adfToMarkdown).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalledTimes(2); // markdown file and metadata file
      
      expect(result).toEqual({
        content: [{
          type: "text",
          text: 'Successfully downloaded page "Test Page" (ID: 123456) to confluence-downloads/123456-test-page.md'
        }]
      });
    });

    it('should download page with custom target directory', async () => {
      const params = {
        pageId: '123456',
        targetDirectory: '/custom/path'
      };

      await downloadTool.handler(params);

      expect(MockedFileManager.createManagedFile).toHaveBeenCalledWith('123456', 'Test Page', '/custom/path');
    });

    it('should throw error when not authenticated', async () => {
      mockedAuthManager.isAuthenticated.mockReturnValue(false);

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Not authenticated. Please authenticate first using confluence_authenticate.');
    });

    it('should throw error when page has no ADF content', async () => {
      const pageWithoutADF = {
        ...mockPage,
        body: {
          atlas_doc_format: {
            value: '',
            representation: 'atlas_doc_format'
          }
        }
      };

      MockedConfluenceClient.prototype.getContent = jest.fn().mockResolvedValue(pageWithoutADF);

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Page 123456 does not have ADF content or is not accessible');
    });

    it('should throw error when page body is missing', async () => {
      const pageWithoutBody = {
        ...mockPage,
        body: undefined
      };

      MockedConfluenceClient.prototype.getContent = jest.fn().mockResolvedValue(pageWithoutBody);

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Page 123456 does not have ADF content or is not accessible');
    });

    it('should handle invalid ADF JSON', async () => {
      const pageWithInvalidADF = {
        ...mockPage,
        body: {
          atlas_doc_format: {
            value: 'invalid json',
            representation: 'atlas_doc_format'
          }
        }
      };

      MockedConfluenceClient.prototype.getContent = jest.fn().mockResolvedValue(pageWithInvalidADF);

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Failed to parse ADF content');
    });

    it('should validate required pageId parameter', async () => {
      const params = {
        pageId: ''
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Invalid parameters');
    });

    it('should handle missing pageId parameter', async () => {
      const params = {};

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Invalid parameters');
    });

    it('should handle ConfluenceClient errors', async () => {
      MockedConfluenceClient.prototype.getContent = jest.fn().mockRejectedValue(new Error('Page not found'));

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Failed to download page: Page not found');
    });

    it('should handle FileManager errors', async () => {
      MockedFileManager.createManagedFile = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Failed to download page: Permission denied');
    });

    it('should handle file write errors', async () => {
      (mockedFs.writeFile as unknown as jest.Mock).mockRejectedValue(new Error('Disk full'));

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Failed to download page: Disk full');
    });

    it('should write correct metadata file', async () => {
      const params = {
        pageId: '123456'
      };

      await downloadTool.handler(params);

      const expectedMetadata = {
        pageId: '123456',
        title: 'Test Page',
        spaceKey: 'TEST',
        originalADF: mockPage.body.atlas_doc_format.value
      };

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/path/to/123456-test-page.meta.json',
        JSON.stringify(expectedMetadata, null, 2),
        'utf-8'
      );
    });

    it('should write correct markdown file', async () => {
      const params = {
        pageId: '123456'
      };

      await downloadTool.handler(params);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        '/path/to/123456-test-page.md',
        '# Test Page\n\nHello world',
        'utf-8'
      );
    });

    it('should handle unknown errors gracefully', async () => {
      MockedConfluenceClient.prototype.getContent = jest.fn().mockRejectedValue('Unknown error');

      const params = {
        pageId: '123456'
      };

      await expect(downloadTool.handler(params)).rejects.toThrow(ToolError);
      await expect(downloadTool.handler(params)).rejects.toThrow('Failed to download page: Unknown error');
    });
  });
});