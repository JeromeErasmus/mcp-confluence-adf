import { createSearchTools } from '../../tools/search.js';
import { authManager } from '../../auth/manager.js';
import { ConfluenceClient } from '../../client/confluence.js';
import { ToolError } from '../../types/index.js';

// Mock dependencies
jest.mock('../../auth/manager.js');
jest.mock('../../client/confluence.js');

describe('Search Tools', () => {
  const mockedAuthManager = authManager as jest.Mocked<typeof authManager>;
  const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;
  let searchTools: ReturnType<typeof createSearchTools>;
  let searchTool: ReturnType<typeof createSearchTools>[0];

  const mockSearchResults = {
    results: [
      {
        id: '123456',
        type: 'page',
        title: 'Test Page about APIs',
        space: { key: 'TEST', name: 'Test Space' },
        version: { number: 1, when: '2023-01-01T00:00:00Z' },
        _links: { webui: '/wiki/spaces/TEST/pages/123456/Test+Page+about+APIs' }
      },
      {
        id: '789012',
        type: 'blogpost',
        title: 'API Integration Guide',
        space: { key: 'DOCS', name: 'Documentation' },
        version: { number: 2, when: '2023-01-02T00:00:00Z' },
        _links: { webui: '/wiki/spaces/DOCS/pages/789012/API+Integration+Guide' }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    searchTools = createSearchTools();
    searchTool = searchTools[0];

    // Default mock implementations
    mockedAuthManager.isAuthenticated.mockReturnValue(true);
    mockedAuthManager.getBaseUrl.mockReturnValue('https://test.atlassian.net');
    MockedConfluenceClient.prototype.searchContent = jest.fn().mockResolvedValue(mockSearchResults);
  });

  describe('tool registration', () => {
    it('should return array of one tool', () => {
      expect(searchTools).toHaveLength(1);
      expect(searchTools[0].name).toBe('confluence_search');
    });
  });

  describe('Search Tool', () => {
    describe('tool configuration', () => {
      it('should have correct tool metadata', () => {
        expect(searchTool.name).toBe('confluence_search');
        expect(searchTool.title).toBe('Search Confluence Content');
        expect(searchTool.description).toBe('Search for Confluence pages and content using text queries.');
      });

      it('should have correct input schema', () => {
        expect(searchTool.inputSchema).toEqual({
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query to find content"
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (1-100, default: 25)"
            }
          },
          required: ["query"]
        });
      });
    });

    describe('handler', () => {
      it('should search content successfully with default limit', async () => {
        const params = {
          query: 'API integration'
        };

        const result = await searchTool.handler(params);

        expect(MockedConfluenceClient.prototype.searchContent).toHaveBeenCalledWith('API integration', 25);
        expect(result).toEqual({
          content: [{
            type: "text",
            text: `Found 2 results for "API integration":

- **Test Page about APIs** (ID: 123456)
  Space: Test Space (TEST)
  Type: page
  URL: https://test.atlassian.net/wiki/spaces/TEST/pages/123456/Test+Page+about+APIs

- **API Integration Guide** (ID: 789012)
  Space: Documentation (DOCS)
  Type: blogpost
  URL: https://test.atlassian.net/wiki/spaces/DOCS/pages/789012/API+Integration+Guide`
          }]
        });
      });

      it('should search content with custom limit', async () => {
        const params = {
          query: 'API integration',
          limit: 50
        };

        await searchTool.handler(params);

        expect(MockedConfluenceClient.prototype.searchContent).toHaveBeenCalledWith('API integration', 50);
      });

      it('should handle empty search results', async () => {
        MockedConfluenceClient.prototype.searchContent = jest.fn().mockResolvedValue({ results: [] });

        const params = {
          query: 'nonexistent content'
        };

        const result = await searchTool.handler(params);

        expect(result).toEqual({
          content: [{
            type: "text",
            text: 'No results found for query: "nonexistent content"'
          }]
        });
      });

      it('should handle single search result', async () => {
        const singleResult = {
          results: [mockSearchResults.results[0]]
        };
        MockedConfluenceClient.prototype.searchContent = jest.fn().mockResolvedValue(singleResult);

        const params = {
          query: 'specific page'
        };

        const result = await searchTool.handler(params);

        expect(result.content[0].text).toContain('Found 1 results for "specific page"');
        expect(result.content[0].text).toContain('Test Page about APIs');
        expect(result.content[0].text).not.toContain('API Integration Guide');
      });

      it('should handle special characters in query', async () => {
        const params = {
          query: 'API & integration (with examples)'
        };

        await searchTool.handler(params);

        expect(MockedConfluenceClient.prototype.searchContent).toHaveBeenCalledWith('API & integration (with examples)', 25);
      });

      it('should handle very long queries', async () => {
        const longQuery = 'a'.repeat(1000);
        const params = {
          query: longQuery
        };

        await searchTool.handler(params);

        expect(MockedConfluenceClient.prototype.searchContent).toHaveBeenCalledWith(longQuery, 25);
      });

      it('should throw error when not authenticated', async () => {
        mockedAuthManager.isAuthenticated.mockReturnValue(false);

        const params = {
          query: 'test'
        };

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Not authenticated. Please authenticate first using confluence_authenticate.');
      });

      it('should validate required query parameter', async () => {
        const params = {
          query: ''
        };

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should handle missing query parameter', async () => {
        const params = {};

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should validate limit parameter range - minimum', async () => {
        const params = {
          query: 'test',
          limit: 0
        };

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should validate limit parameter range - maximum', async () => {
        const params = {
          query: 'test',
          limit: 150
        };

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Invalid parameters');
      });

      it('should handle API errors during search', async () => {
        MockedConfluenceClient.prototype.searchContent = jest.fn().mockRejectedValue(new Error('Search service unavailable'));

        const params = {
          query: 'test'
        };

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Failed to search content: Search service unavailable');
      });

      it('should handle network errors gracefully', async () => {
        MockedConfluenceClient.prototype.searchContent = jest.fn().mockRejectedValue(new Error('Network timeout'));

        const params = {
          query: 'test'
        };

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Failed to search content: Network timeout');
      });

      it('should handle unknown errors gracefully', async () => {
        MockedConfluenceClient.prototype.searchContent = jest.fn().mockRejectedValue('Unknown search error');

        const params = {
          query: 'test'
        };

        await expect(searchTool.handler(params)).rejects.toThrow(ToolError);
        await expect(searchTool.handler(params)).rejects.toThrow('Failed to search content: Unknown error');
      });

      it('should handle CQL injection attempts safely', async () => {
        const maliciousQuery = 'test"; DROP TABLE pages; --';
        const params = {
          query: maliciousQuery
        };

        await searchTool.handler(params);

        // The search should still work (Confluence API handles CQL safely)
        expect(MockedConfluenceClient.prototype.searchContent).toHaveBeenCalledWith(maliciousQuery, 25);
      });

      it('should handle Unicode characters in query', async () => {
        const unicodeQuery = '测试 API интеграция 🚀';
        const params = {
          query: unicodeQuery
        };

        await searchTool.handler(params);

        expect(MockedConfluenceClient.prototype.searchContent).toHaveBeenCalledWith(unicodeQuery, 25);
      });

      it('should format URLs correctly with base URL', async () => {
        const params = {
          query: 'test'
        };

        const result = await searchTool.handler(params);

        expect(result.content[0].text).toContain('https://test.atlassian.net/wiki/spaces/TEST/pages/123456/Test+Page+about+APIs');
        expect(result.content[0].text).toContain('https://test.atlassian.net/wiki/spaces/DOCS/pages/789012/API+Integration+Guide');
      });
    });
  });
});