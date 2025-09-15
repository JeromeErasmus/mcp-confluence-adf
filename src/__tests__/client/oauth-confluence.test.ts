import { OAuthConfluenceClient } from '../../client/oauth-confluence.js';
import { OAuthClient } from '../../auth/oauth-client.js';

// Mock dependencies
jest.mock('../../auth/oauth-client.js');

const mockOAuthClient = OAuthClient as jest.MockedClass<typeof OAuthClient>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('OAuthConfluenceClient', () => {
  let oauthConfluenceClient: OAuthConfluenceClient;
  let mockClient: jest.Mocked<OAuthClient>;

  beforeEach(() => {
    mockClient = {
      ensureValidToken: jest.fn().mockResolvedValue(undefined),
      getAuthHeaders: jest.fn().mockReturnValue({
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      getCloudId: jest.fn().mockReturnValue('test-cloud-id')
    } as any;

    oauthConfluenceClient = new OAuthConfluenceClient(mockClient);
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    it('should initialize with OAuth client', () => {
      expect(oauthConfluenceClient).toBeInstanceOf(OAuthConfluenceClient);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ 
          results: [{ key: 'TEST', name: 'Test Space' }]
        }),
        text: async () => 'success'
      } as Response);

      const result = await oauthConfluenceClient.testConnection();

      expect(mockClient.ensureValidToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/space',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      expect(result).toEqual({ success: true });
    });

    it('should handle connection test failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      } as Response);

      const result = await oauthConfluenceClient.testConnection();

      expect(result).toEqual({
        success: false,
        error: 'HTTP 401: Unauthorized'
      });
    });

    it('should handle token validation failure', async () => {
      mockClient.ensureValidToken.mockRejectedValue(new Error('Token expired'));

      const result = await oauthConfluenceClient.testConnection();

      expect(result).toEqual({
        success: false,
        error: 'Token expired'
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await oauthConfluenceClient.testConnection();

      expect(result).toEqual({
        success: false,
        error: 'Network error'
      });
    });
  });

  describe('getContent', () => {
    it('should get content successfully', async () => {
      const mockResponse = {
        id: '123456',
        title: 'Test Page',
        type: 'page',
        body: {
          atlas_doc_format: {
            value: '{"version":1,"type":"doc","content":[]}',
            representation: 'atlas_doc_format'
          }
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await oauthConfluenceClient.getContent('123456', ['body.atlas_doc_format']);

      expect(mockClient.ensureValidToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/content/123456?expand=body.atlas_doc_format',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle get content failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => 'Page not found'
      } as Response);

      await expect(oauthConfluenceClient.getContent('123456'))
        .rejects.toThrow('HTTP 404: Page not found');
    });

    it('should handle content request without expand parameters', async () => {
      const mockResponse = {
        id: '123456',
        title: 'Test Page',
        type: 'page'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await oauthConfluenceClient.getContent('123456');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/content/123456',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createContent', () => {
    const mockContentData = {
      type: 'page',
      title: 'Test Page',
      space: { key: 'TEST' },
      body: {
        atlas_doc_format: {
          value: '{"version":1,"type":"doc","content":[]}',
          representation: 'atlas_doc_format'
        }
      }
    };

    it('should create content successfully', async () => {
      const mockResponse = {
        id: '123456',
        title: 'Test Page',
        type: 'page',
        status: 'current'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await oauthConfluenceClient.createContent(mockContentData);

      expect(mockClient.ensureValidToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/content',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(mockContentData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle create content failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad request'
      } as Response);

      await expect(oauthConfluenceClient.createContent(mockContentData))
        .rejects.toThrow('HTTP 400: Bad request');
    });

    it('should handle content with ancestors', async () => {
      const contentWithAncestors = {
        ...mockContentData,
        ancestors: [{ id: '789012' }]
      };

      const mockResponse = {
        id: '123456',
        title: 'Test Page',
        type: 'page'
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await oauthConfluenceClient.createContent(contentWithAncestors);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(contentWithAncestors)
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateContent', () => {
    const mockUpdateData = {
      type: 'page',
      title: 'Updated Test Page',
      version: { number: 2 },
      body: {
        atlas_doc_format: {
          value: '{"version":1,"type":"doc","content":[]}',
          representation: 'atlas_doc_format'
        }
      }
    };

    it('should update content successfully', async () => {
      const mockResponse = {
        id: '123456',
        title: 'Updated Test Page',
        type: 'page',
        status: 'current',
        version: { number: 2 }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await oauthConfluenceClient.updateContent('123456', mockUpdateData);

      expect(mockClient.ensureValidToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/content/123456',
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(mockUpdateData)
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle update content failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        text: async () => 'Conflict - version mismatch'
      } as Response);

      await expect(oauthConfluenceClient.updateContent('123456', mockUpdateData))
        .rejects.toThrow('HTTP 409: Conflict - version mismatch');
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204
      } as Response);

      await expect(oauthConfluenceClient.deleteContent('123456')).resolves.not.toThrow();

      expect(mockClient.ensureValidToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/content/123456',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
    });

    it('should handle delete content failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Permission denied'
      } as Response);

      await expect(oauthConfluenceClient.deleteContent('123456'))
        .rejects.toThrow('HTTP 403: Permission denied');
    });
  });

  describe('getSpaces', () => {
    it('should get spaces successfully', async () => {
      const mockResponse = {
        results: [
          { key: 'TEST', name: 'Test Space' },
          { key: 'DEV', name: 'Development Space' }
        ],
        size: 2
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await oauthConfluenceClient.getSpaces();

      expect(mockClient.ensureValidToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/space?limit=25',
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle custom limit parameter', async () => {
      const mockResponse = { results: [], size: 0 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await oauthConfluenceClient.getSpaces(50);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/space?limit=50',
        expect.any(Object)
      );
    });

    it('should handle get spaces failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Access denied'
      } as Response);

      await expect(oauthConfluenceClient.getSpaces())
        .rejects.toThrow('HTTP 403: Access denied');
    });
  });

  describe('searchContent', () => {
    it('should search content successfully', async () => {
      const mockResponse = {
        results: [
          { id: '123456', title: 'Test Page 1' },
          { id: '789012', title: 'Test Page 2' }
        ],
        size: 2
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await oauthConfluenceClient.searchContent('test query');

      expect(mockClient.ensureValidToken).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('title%20~%20%22test%20query%22%20OR%20text%20~%20%22test%20query%22'),
        {
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle custom limit parameter', async () => {
      const mockResponse = { results: [], size: 0 };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await oauthConfluenceClient.searchContent('test', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });

    it('should handle search content failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid CQL query'
      } as Response);

      await expect(oauthConfluenceClient.searchContent('invalid query'))
        .rejects.toThrow('HTTP 400: Invalid CQL query');
    });
  });

  describe('getOAuthClient', () => {
    it('should return the OAuth client', () => {
      const client = oauthConfluenceClient.getOAuthClient();
      expect(client).toBe(mockClient);
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      mockClient.ensureValidToken.mockResolvedValue();
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      const result = await oauthConfluenceClient.testConnection();

      expect(result).toEqual({
        success: false,
        error: 'Request timeout'
      });
    });

    it('should handle malformed JSON responses', async () => {
      mockClient.ensureValidToken.mockResolvedValue();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      const result = await oauthConfluenceClient.testConnection();

      expect(result).toEqual({
        success: false,
        error: 'Invalid JSON'
      });
    });

    it('should handle empty error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => ''
      } as Response);

      await expect(oauthConfluenceClient.getContent('123456'))
        .rejects.toThrow('HTTP 500: ');
    });

    it('should propagate token validation errors', async () => {
      mockClient.ensureValidToken.mockRejectedValue(new Error('Token refresh failed'));

      await expect(oauthConfluenceClient.getContent('123456'))
        .rejects.toThrow('Token refresh failed');

      await expect(oauthConfluenceClient.createContent({
        type: 'page',
        title: 'Test',
        space: { key: 'TEST' },
        body: { atlas_doc_format: { value: '{}', representation: 'atlas_doc_format' } }
      })).rejects.toThrow('Token refresh failed');
    });
  });

  describe('API URL construction', () => {
    it('should construct correct API URLs with cloud ID', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
        text: async () => 'success'
      } as Response);

      await oauthConfluenceClient.testConnection();
      await oauthConfluenceClient.getContent('123456');
      await oauthConfluenceClient.getSpaces();

      const calls = mockFetch.mock.calls;
      calls.forEach(call => {
        expect(call[0]).toContain('https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/');
      });
    });

    it('should properly encode search query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] })
      } as Response);

      await oauthConfluenceClient.searchContent('test "quoted" query');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test%20%5C%22quoted%5C%22%20query'),
        expect.any(Object)
      );
    });

    it('should handle different expand parameters correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      } as Response);

      await oauthConfluenceClient.getContent('123456', ['body.atlas_doc_format', 'version', 'space']);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.atlassian.com/ex/confluence/test-cloud-id/wiki/rest/api/content/123456?expand=body.atlas_doc_format%2Cversion%2Cspace',
        expect.any(Object)
      );
    });
  });

  describe('request headers and methods', () => {
    it('should always include OAuth headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
        text: async () => 'success',
        status: 204
      } as Response);

      await oauthConfluenceClient.testConnection();
      await oauthConfluenceClient.getContent('123456');

      const calls = mockFetch.mock.calls;
      calls.forEach(call => {
        expect(call[1]).toMatchObject({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        });
      });
    });

    it('should use correct HTTP methods', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}),
        text: async () => 'success',
        status: 204
      } as Response);

      await oauthConfluenceClient.getContent('123456'); // GET
      await oauthConfluenceClient.createContent({
        type: 'page',
        title: 'Test',
        space: { key: 'TEST' },
        body: { atlas_doc_format: { value: '{}', representation: 'atlas_doc_format' } }
      }); // POST
      await oauthConfluenceClient.updateContent('123456', {
        type: 'page',
        title: 'Test',
        version: { number: 2 },
        body: { atlas_doc_format: { value: '{}', representation: 'atlas_doc_format' } }
      }); // PUT
      await oauthConfluenceClient.deleteContent('123456'); // DELETE

      const calls = mockFetch.mock.calls;
      expect(calls[0][1]).not.toHaveProperty('method'); // GET is default
      expect(calls[1][1]).toMatchObject({ method: 'POST' });
      expect(calls[2][1]).toMatchObject({ method: 'PUT' });
      expect(calls[3][1]).toMatchObject({ method: 'DELETE' });
    });
  });
});