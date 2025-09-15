import { AuthManager } from '../../auth/manager.js';
import * as oauthModule from '../../tools/oauth.js';

// Mock the oauth module
jest.mock('../../tools/oauth.js');

const mockOauthModule = oauthModule as jest.Mocked<typeof oauthModule>;

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    authManager = new AuthManager();
    jest.clearAllMocks();
  });

  describe('isAuthenticated', () => {
    it('should return true when OAuth is authenticated', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);

      expect(authManager.isAuthenticated()).toBe(true);
      expect(mockOauthModule.isOAuthAuthenticated).toHaveBeenCalled();
    });

    it('should return false when OAuth is not authenticated', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(false);

      expect(authManager.isAuthenticated()).toBe(false);
      expect(mockOauthModule.isOAuthAuthenticated).toHaveBeenCalled();
    });
  });

  describe('getAuthHeaders', () => {
    it('should return OAuth headers when authenticated', () => {
      const mockHeaders = {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      const mockOAuthClient = {
        getAuthHeaders: jest.fn().mockReturnValue(mockHeaders)
      };

      const mockOAuthConfluenceClient = {
        getOAuthClient: jest.fn().mockReturnValue(mockOAuthClient)
      };

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(mockOAuthConfluenceClient as any);

      const headers = authManager.getAuthHeaders();

      expect(headers).toEqual(mockHeaders);
      expect(mockOAuthClient.getAuthHeaders).toHaveBeenCalled();
    });

    it('should throw error when not authenticated', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(false);

      expect(() => authManager.getAuthHeaders())
        .toThrow('Not authenticated - OAuth required');
    });

    it('should throw error when OAuth client not available', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(null);

      expect(() => authManager.getAuthHeaders())
        .toThrow('OAuth client not available');
    });

    it('should throw error when OAuth client method fails', () => {
      const mockOAuthClient = {
        getAuthHeaders: jest.fn().mockImplementation(() => {
          throw new Error('Token expired');
        })
      };

      const mockOAuthConfluenceClient = {
        getOAuthClient: jest.fn().mockReturnValue(mockOAuthClient)
      };

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(mockOAuthConfluenceClient as any);

      expect(() => authManager.getAuthHeaders())
        .toThrow('Failed to get OAuth headers: Token expired');
    });
  });

  describe('getCloudId', () => {
    it('should return cloud ID from OAuth client when authenticated', () => {
      const mockOAuthClient = {
        getCloudId: jest.fn().mockReturnValue('test-cloud-id')
      };

      const mockOAuthConfluenceClient = {
        getOAuthClient: jest.fn().mockReturnValue(mockOAuthClient)
      };

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(mockOAuthConfluenceClient as any);

      const cloudId = authManager.getCloudId();

      expect(cloudId).toBe('test-cloud-id');
      expect(mockOAuthClient.getCloudId).toHaveBeenCalled();
    });

    it('should throw error when not authenticated', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(false);

      expect(() => authManager.getCloudId())
        .toThrow('Not authenticated - OAuth required');
    });

    it('should throw error when OAuth client not available', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(null);

      expect(() => authManager.getCloudId())
        .toThrow('OAuth client not available');
    });

    it('should throw error when OAuth client method fails', () => {
      const mockOAuthClient = {
        getCloudId: jest.fn().mockImplementation(() => {
          throw new Error('No cloud ID available');
        })
      };

      const mockOAuthConfluenceClient = {
        getOAuthClient: jest.fn().mockReturnValue(mockOAuthClient)
      };

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(mockOAuthConfluenceClient as any);

      expect(() => authManager.getCloudId())
        .toThrow('Failed to get cloud ID: No cloud ID available');
    });
  });

  describe('getConfluenceClient', () => {
    it('should return OAuth Confluence client when authenticated', () => {
      const mockOAuthConfluenceClient = {
        testConnection: jest.fn()
      };

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(mockOAuthConfluenceClient as any);

      const client = authManager.getConfluenceClient();

      expect(client).toBe(mockOAuthConfluenceClient);
    });

    it('should throw error when not authenticated', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(false);

      expect(() => authManager.getConfluenceClient())
        .toThrow('Not authenticated - OAuth required');
    });

    it('should throw error when OAuth client not available', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(null);

      expect(() => authManager.getConfluenceClient())
        .toThrow('OAuth client not available');
    });
  });

  describe('OAuth-only authentication', () => {
    it('should only support OAuth authentication', () => {
      // Verify that the manager only provides OAuth-based methods
      expect(authManager.isAuthenticated).toBeDefined();
      expect(authManager.getAuthHeaders).toBeDefined();
      expect(authManager.getCloudId).toBeDefined();
      expect(authManager.getConfluenceClient).toBeDefined();

      // Verify no legacy API token methods exist
      expect((authManager as any).setApiToken).toBeUndefined();
      expect((authManager as any).getApiToken).toBeUndefined();
      expect((authManager as any).clearApiToken).toBeUndefined();
    });

    it('should handle OAuth authentication state changes', () => {
      // Test transition from not authenticated to authenticated
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(false);
      expect(authManager.isAuthenticated()).toBe(false);

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      expect(authManager.isAuthenticated()).toBe(true);
    });

    it('should consistently check OAuth state', () => {
      const mockOAuthClient = {
        getAuthHeaders: jest.fn().mockReturnValue({}),
        getCloudId: jest.fn().mockReturnValue('test-cloud-id')
      };

      const mockOAuthConfluenceClient = {
        getOAuthClient: jest.fn().mockReturnValue(mockOAuthClient)
      };

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(mockOAuthConfluenceClient as any);

      // Multiple method calls should all check OAuth state
      authManager.isAuthenticated();
      authManager.getAuthHeaders();
      authManager.getCloudId();
      authManager.getConfluenceClient();

      expect(mockOauthModule.isOAuthAuthenticated).toHaveBeenCalledTimes(4);
    });
  });

  describe('error propagation', () => {
    it('should propagate OAuth client errors without modification', () => {
      const mockOAuthClient = {
        getAuthHeaders: jest.fn().mockImplementation(() => {
          throw new Error('Specific OAuth error');
        })
      };

      const mockOAuthConfluenceClient = {
        getOAuthClient: jest.fn().mockReturnValue(mockOAuthClient)
      };

      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue(mockOAuthConfluenceClient as any);

      expect(() => authManager.getAuthHeaders())
        .toThrow('Failed to get OAuth headers: Specific OAuth error');
    });

    it('should handle null/undefined OAuth client gracefully', () => {
      mockOauthModule.isOAuthAuthenticated.mockReturnValue(true);
      mockOauthModule.getOAuthConfluenceClient.mockReturnValue({
        getOAuthClient: jest.fn().mockReturnValue(null)
      } as any);

      expect(() => authManager.getAuthHeaders())
        .toThrow('OAuth client not available');

      expect(() => authManager.getCloudId())
        .toThrow('OAuth client not available');
    });
  });
});