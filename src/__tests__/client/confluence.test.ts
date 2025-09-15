import { ConfluenceClient } from '../../client/confluence.js';
import { authManager } from '../../auth/manager.js';
import { ConfluenceContent, ConfluenceSpace } from '../../types/index.js';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the auth manager
jest.mock('../../auth/manager.js', () => ({
  authManager: {
    getBaseUrl: jest.fn(),
    getAuthHeaders: jest.fn()
  }
}));

describe('ConfluenceClient', () => {
  let client: ConfluenceClient;
  const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;
  const mockedAuthManager = authManager as jest.Mocked<typeof authManager>;

  beforeEach(() => {
    client = new ConfluenceClient();
    jest.clearAllMocks();
    
    mockedAuthManager.getBaseUrl.mockReturnValue('https://test.atlassian.net');
    mockedAuthManager.getAuthHeaders.mockReturnValue({
      'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu', // test@example.com:test-token
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  });

  describe('testConnection', () => {
    it('should return success when connection is valid', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accountId: 'test-user' })
      } as Response);

      const result = await client.testConnection();
      
      expect(result).toEqual({ success: true });
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/user/current',
        {
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should return error when response is not ok', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      } as Response);

      const result = await client.testConnection();
      
      expect(result).toEqual({
        success: false,
        error: 'HTTP 401: Unauthorized'
      });
    });

    it('should handle network errors', async () => {
      mockedFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.testConnection();
      
      expect(result).toEqual({
        success: false,
        error: 'Network error'
      });
    });

    it('should handle unknown errors', async () => {
      mockedFetch.mockRejectedValueOnce('Unknown error');

      const result = await client.testConnection();
      
      expect(result).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });
  });

  describe('getContent', () => {
    const mockContent: ConfluenceContent = {
      id: '123',
      type: 'page',
      title: 'Test Page',
      space: { key: 'TEST', name: 'Test Space' },
      version: { number: 1, when: '2023-01-01T00:00:00Z' },
      _links: { webui: '/wiki/spaces/TEST/pages/123/Test+Page' }
    };

    it('should fetch content without expand parameters', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent
      } as Response);

      const result = await client.getContent('123');
      
      expect(result).toEqual(mockContent);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/123',
        {
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should fetch content with expand parameters', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockContent
      } as Response);

      const result = await client.getContent('123', ['body.atlas_doc_format', 'space']);
      
      expect(result).toEqual(mockContent);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/123?expand=body.atlas_doc_format%2Cspace',
        {
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should throw error when response is not ok', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Page not found'
      } as Response);

      await expect(client.getContent('123')).rejects.toThrow('HTTP 404: Page not found');
    });
  });

  describe('createContent', () => {
    const contentData = {
      type: 'page',
      title: 'New Page',
      space: { key: 'TEST' },
      body: {
        atlas_doc_format: {
          value: '{"version":1,"type":"doc","content":[]}',
          representation: 'atlas_doc_format'
        }
      }
    };

    const mockResponse: ConfluenceContent = {
      id: '456',
      type: 'page',
      title: 'New Page',
      space: { key: 'TEST', name: 'Test Space' },
      version: { number: 1, when: '2023-01-01T00:00:00Z' },
      _links: { webui: '/wiki/spaces/TEST/pages/456/New+Page' }
    };

    it('should create content successfully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.createContent(contentData);
      
      expect(result).toEqual(mockResponse);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(contentData)
        }
      );
    });

    it('should throw error when creation fails', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request'
      } as Response);

      await expect(client.createContent(contentData)).rejects.toThrow('HTTP 400: Bad request');
    });
  });

  describe('updateContent', () => {
    const updateData = {
      type: 'page',
      title: 'Updated Page',
      version: { number: 2 },
      body: {
        atlas_doc_format: {
          value: '{"version":1,"type":"doc","content":[]}',
          representation: 'atlas_doc_format'
        }
      }
    };

    const mockResponse: ConfluenceContent = {
      id: '123',
      type: 'page',
      title: 'Updated Page',
      space: { key: 'TEST', name: 'Test Space' },
      version: { number: 2, when: '2023-01-01T00:00:00Z' },
      _links: { webui: '/wiki/spaces/TEST/pages/123/Updated+Page' }
    };

    it('should update content successfully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.updateContent('123', updateData);
      
      expect(result).toEqual(mockResponse);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/123',
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(updateData)
        }
      );
    });

    it('should throw error when update fails', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => 'Conflict'
      } as Response);

      await expect(client.updateContent('123', updateData)).rejects.toThrow('HTTP 409: Conflict');
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true
      } as Response);

      await client.deleteContent('123');
      
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/123',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should throw error when deletion fails', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden'
      } as Response);

      await expect(client.deleteContent('123')).rejects.toThrow('HTTP 403: Forbidden');
    });
  });

  describe('getSpaces', () => {
    const mockSpaces = {
      results: [
        {
          id: '1',
          key: 'TEST',
          name: 'Test Space',
          _links: { webui: '/wiki/spaces/TEST' }
        } as ConfluenceSpace
      ]
    };

    it('should get spaces with default limit', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSpaces
      } as Response);

      const result = await client.getSpaces();
      
      expect(result).toEqual(mockSpaces);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/space?limit=25',
        {
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should get spaces with custom limit', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSpaces
      } as Response);

      const result = await client.getSpaces(50);
      
      expect(result).toEqual(mockSpaces);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/space?limit=50',
        {
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });
  });

  describe('searchContent', () => {
    const mockSearchResults = {
      results: [
        {
          id: '123',
          type: 'page',
          title: 'Search Result',
          space: { key: 'TEST', name: 'Test Space' },
          version: { number: 1, when: '2023-01-01T00:00:00Z' },
          _links: { webui: '/wiki/spaces/TEST/pages/123/Search+Result' }
        } as ConfluenceContent
      ]
    };

    it('should search content with default limit', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults
      } as Response);

      const result = await client.searchContent('test query');
      
      expect(result).toEqual(mockSearchResults);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/search?cql=title+%7E+%22test+query%22+OR+text+%7E+%22test+query%22&limit=25',
        {
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should search content with custom limit', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSearchResults
      } as Response);

      const result = await client.searchContent('test query', 50);
      
      expect(result).toEqual(mockSearchResults);
      expect(mockedFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/wiki/rest/api/content/search?cql=title+%7E+%22test+query%22+OR+text+%7E+%22test+query%22&limit=50',
        {
          headers: {
            'Authorization': 'Basic dGVzdEBleGFtcGxlLmNvbTp0ZXN0LXRva2Vu',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should throw error when search fails', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad query'
      } as Response);

      await expect(client.searchContent('test query')).rejects.toThrow('HTTP 400: Bad query');
    });
  });
});