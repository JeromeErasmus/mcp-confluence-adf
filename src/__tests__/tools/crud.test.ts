import { createCrudTools } from '../../tools/crud.js';
import { authManager } from '../../auth/manager.js';
import { ConfluenceClient } from '../../client/confluence.js';
import { ToolError } from '../../types/index.js';

// Mock dependencies
jest.mock('../../auth/manager.js');
jest.mock('../../client/confluence.js');

describe('CRUD Tools', () => {
  const mockedAuthManager = authManager as jest.Mocked<typeof authManager>;
  const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;
  let crudTools: ReturnType<typeof createCrudTools>;

  const mockPage = {
    id: '123456',
    title: 'Test Page',
    space: { key: 'TEST', name: 'Test Space' },
    version: { number: 1, when: '2023-01-01T00:00:00Z' },
    _links: { webui: '/wiki/spaces/TEST/pages/123456/Test+Page' }
  };

  const mockSpaces = {
    results: [
      {
        id: '1',
        key: 'TEST',
        name: 'Test Space',
        description: {
          plain: {
            value: 'A test space'
          }
        },
        _links: { webui: '/wiki/spaces/TEST' }
      },
      {
        id: '2',
        key: 'DOCS',
        name: 'Documentation',
        _links: { webui: '/wiki/spaces/DOCS' }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    crudTools = createCrudTools();

    // Default mock implementations
    mockedAuthManager.isAuthenticated.mockReturnValue(true);
    mockedAuthManager.getBaseUrl.mockReturnValue('https://test.atlassian.net');
    MockedConfluenceClient.prototype.getContent = jest.fn().mockResolvedValue(mockPage);
    MockedConfluenceClient.prototype.deleteContent = jest.fn().mockResolvedValue(undefined);
    MockedConfluenceClient.prototype.getSpaces = jest.fn().mockResolvedValue(mockSpaces);
  });

  describe('tool registration', () => {
    it('should return array of three tools', () => {
      expect(crudTools).toHaveLength(3);
      expect(crudTools.map(tool => tool.name)).toEqual([
        'confluence_get_page',
        'confluence_delete_page',
        'confluence_list_spaces'
      ]);
    });
  });

  describe('Get Page Tool', () => {
    let getPageTool: ReturnType<typeof createCrudTools>[0];

    beforeEach(() => {
      getPageTool = crudTools[0];
    });

    describe('tool configuration', () => {
      it('should have correct tool metadata', () => {
        expect(getPageTool.name).toBe('confluence_get_page');
        expect(getPageTool.title).toBe('Get Confluence Page Info');
        expect(getPageTool.description).toBe('Retrieve basic information about a Confluence page (metadata only, not content).');
      });

      it('should have correct input schema', () => {
        expect(getPageTool.inputSchema).toEqual({
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "Confluence page ID to retrieve"
            }
          },
          required: ["pageId"]
        });
      });
    });

    describe('handler', () => {
      it('should get page info successfully', async () => {
        const params = { pageId: '123456' };
        const result = await getPageTool.handler(params);

        expect(MockedConfluenceClient.prototype.getContent).toHaveBeenCalledWith('123456', ['space', 'version']);
        expect(result).toEqual({
          content: [{
            type: "text",
            text: `Page Information:
- ID: 123456
- Title: Test Page
- Space: Test Space (TEST)
- Version: 1
- Last Updated: 2023-01-01T00:00:00Z
- URL: https://test.atlassian.net/wiki/spaces/TEST/pages/123456/Test+Page`
          }]
        });
      });

      it('should throw error when not authenticated', async () => {
        mockedAuthManager.isAuthenticated.mockReturnValue(false);
        const params = { pageId: '123456' };

        await expect(getPageTool.handler(params)).rejects.toThrow(ToolError);
        await expect(getPageTool.handler(params)).rejects.toThrow('Not authenticated. Please authenticate first using confluence_authenticate.');
      });

      it('should validate required pageId parameter', async () => {
        const params = { pageId: '' };

        await expect(getPageTool.handler(params)).rejects.toThrow(ToolError);
        await expect(getPageTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should handle API errors', async () => {
        MockedConfluenceClient.prototype.getContent = jest.fn().mockRejectedValue(new Error('Page not found'));
        const params = { pageId: '123456' };

        await expect(getPageTool.handler(params)).rejects.toThrow(ToolError);
        await expect(getPageTool.handler(params)).rejects.toThrow('Failed to get page: Page not found');
      });
    });
  });

  describe('Delete Page Tool', () => {
    let deletePageTool: ReturnType<typeof createCrudTools>[1];

    beforeEach(() => {
      deletePageTool = crudTools[1];
    });

    describe('tool configuration', () => {
      it('should have correct tool metadata', () => {
        expect(deletePageTool.name).toBe('confluence_delete_page');
        expect(deletePageTool.title).toBe('Delete Confluence Page');
        expect(deletePageTool.description).toBe('Delete a Confluence page permanently.');
      });

      it('should have correct input schema', () => {
        expect(deletePageTool.inputSchema).toEqual({
          type: "object",
          properties: {
            pageId: {
              type: "string",
              description: "Confluence page ID to delete"
            }
          },
          required: ["pageId"]
        });
      });
    });

    describe('handler', () => {
      it('should delete page successfully', async () => {
        const params = { pageId: '123456' };
        const result = await deletePageTool.handler(params);

        expect(MockedConfluenceClient.prototype.getContent).toHaveBeenCalledWith('123456', ['space']);
        expect(MockedConfluenceClient.prototype.deleteContent).toHaveBeenCalledWith('123456');
        expect(result).toEqual({
          content: [{
            type: "text",
            text: 'Successfully deleted page "Test Page" (ID: 123456) from space TEST'
          }]
        });
      });

      it('should throw error when not authenticated', async () => {
        mockedAuthManager.isAuthenticated.mockReturnValue(false);
        const params = { pageId: '123456' };

        await expect(deletePageTool.handler(params)).rejects.toThrow(ToolError);
        await expect(deletePageTool.handler(params)).rejects.toThrow('Not authenticated. Please authenticate first using confluence_authenticate.');
      });

      it('should validate required pageId parameter', async () => {
        const params = { pageId: '' };

        await expect(deletePageTool.handler(params)).rejects.toThrow(ToolError);
        await expect(deletePageTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should handle API errors during deletion', async () => {
        MockedConfluenceClient.prototype.deleteContent = jest.fn().mockRejectedValue(new Error('Permission denied'));
        const params = { pageId: '123456' };

        await expect(deletePageTool.handler(params)).rejects.toThrow(ToolError);
        await expect(deletePageTool.handler(params)).rejects.toThrow('Failed to delete page: Permission denied');
      });

      it('should handle API errors during page info retrieval', async () => {
        MockedConfluenceClient.prototype.getContent = jest.fn().mockRejectedValue(new Error('Page not found'));
        const params = { pageId: '123456' };

        await expect(deletePageTool.handler(params)).rejects.toThrow(ToolError);
        await expect(deletePageTool.handler(params)).rejects.toThrow('Failed to delete page: Page not found');
      });
    });
  });

  describe('List Spaces Tool', () => {
    let listSpacesTool: ReturnType<typeof createCrudTools>[2];

    beforeEach(() => {
      listSpacesTool = crudTools[2];
    });

    describe('tool configuration', () => {
      it('should have correct tool metadata', () => {
        expect(listSpacesTool.name).toBe('confluence_list_spaces');
        expect(listSpacesTool.title).toBe('List Confluence Spaces');
        expect(listSpacesTool.description).toBe('List available Confluence spaces.');
      });

      it('should have correct input schema', () => {
        expect(listSpacesTool.inputSchema).toEqual({
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of spaces to return (1-100, default: 25)"
            }
          }
        });
      });
    });

    describe('handler', () => {
      it('should list spaces successfully with default limit', async () => {
        const params = {};
        const result = await listSpacesTool.handler(params);

        expect(MockedConfluenceClient.prototype.getSpaces).toHaveBeenCalledWith(25);
        expect(result).toEqual({
          content: [{
            type: "text",
            text: `Found 2 spaces:

- **Test Space** (TEST)
  Description: A test space
  URL: https://test.atlassian.net/wiki/spaces/TEST

- **Documentation** (DOCS)
  Description: No description
  URL: https://test.atlassian.net/wiki/spaces/DOCS`
          }]
        });
      });

      it('should list spaces with custom limit', async () => {
        const params = { limit: 50 };
        await listSpacesTool.handler(params);

        expect(MockedConfluenceClient.prototype.getSpaces).toHaveBeenCalledWith(50);
      });

      it('should handle empty spaces list', async () => {
        MockedConfluenceClient.prototype.getSpaces = jest.fn().mockResolvedValue({ results: [] });
        const params = {};
        const result = await listSpacesTool.handler(params);

        expect(result).toEqual({
          content: [{
            type: "text",
            text: "No spaces found or no access to any spaces."
          }]
        });
      });

      it('should handle spaces without descriptions', async () => {
        const spacesWithoutDesc = {
          results: [
            {
              id: '1',
              key: 'TEST',
              name: 'Test Space',
              _links: { webui: '/wiki/spaces/TEST' }
            }
          ]
        };
        MockedConfluenceClient.prototype.getSpaces = jest.fn().mockResolvedValue(spacesWithoutDesc);

        const params = {};
        const result = await listSpacesTool.handler(params);

        expect(result.content[0].text).toContain('Description: No description');
      });

      it('should throw error when not authenticated', async () => {
        mockedAuthManager.isAuthenticated.mockReturnValue(false);
        const params = {};

        await expect(listSpacesTool.handler(params)).rejects.toThrow(ToolError);
        await expect(listSpacesTool.handler(params)).rejects.toThrow('Not authenticated. Please authenticate first using confluence_authenticate.');
      });

      it('should validate limit parameter range', async () => {
        const params = { limit: 0 };

        await expect(listSpacesTool.handler(params)).rejects.toThrow(ToolError);
        await expect(listSpacesTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should validate limit parameter maximum', async () => {
        const params = { limit: 150 };

        await expect(listSpacesTool.handler(params)).rejects.toThrow(ToolError);
        await expect(listSpacesTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should handle API errors', async () => {
        MockedConfluenceClient.prototype.getSpaces = jest.fn().mockRejectedValue(new Error('Access denied'));
        const params = {};

        await expect(listSpacesTool.handler(params)).rejects.toThrow(ToolError);
        await expect(listSpacesTool.handler(params)).rejects.toThrow('Failed to list spaces: Access denied');
      });

      it('should handle unknown errors gracefully', async () => {
        MockedConfluenceClient.prototype.getSpaces = jest.fn().mockRejectedValue('Unknown error');
        const params = {};

        await expect(listSpacesTool.handler(params)).rejects.toThrow(ToolError);
        await expect(listSpacesTool.handler(params)).rejects.toThrow('Failed to list spaces: Unknown error');
      });
    });
  });
});