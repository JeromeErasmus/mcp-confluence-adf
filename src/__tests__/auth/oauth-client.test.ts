import { OAuthClient } from '../../auth/oauth-client.js';
import { OAuthCredentials } from '../../types/index.js';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('OAuthClient', () => {
  let oauthClient: OAuthClient;
  let credentials: OAuthCredentials;

  beforeEach(() => {
    credentials = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/oauth/callback'
    };
    oauthClient = new OAuthClient(credentials);
    mockFetch.mockClear();
  });

  afterEach(() => {
    oauthClient.clear();
  });

  describe('generateAuthUrl', () => {
    it('should generate a valid OAuth authorization URL', () => {
      const authUrl = oauthClient.generateAuthUrl();
      
      expect(authUrl).toMatch(/^https:\/\/auth\.atlassian\.com\/authorize\?/);
      expect(authUrl).toContain('audience=api.atlassian.com');
      expect(authUrl).toContain('client_id=test-client-id');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('prompt=consent');
      expect(authUrl).toContain('code_challenge_method=S256');
      
      // Should include required scopes
      const decodedUrl = decodeURIComponent(authUrl);
      expect(decodedUrl).toContain('read:confluence-content.all');
      expect(decodedUrl).toContain('write:confluence-content');
      expect(decodedUrl).toContain('offline_access');
    });

    it('should generate different state and code challenge on each call', () => {
      const authUrl1 = oauthClient.generateAuthUrl();
      const authUrl2 = oauthClient.generateAuthUrl();
      
      expect(authUrl1).not.toEqual(authUrl2);
      
      const state1 = new URL(authUrl1).searchParams.get('state');
      const state2 = new URL(authUrl2).searchParams.get('state');
      expect(state1).not.toEqual(state2);
      
      const challenge1 = new URL(authUrl1).searchParams.get('code_challenge');
      const challenge2 = new URL(authUrl2).searchParams.get('code_challenge');
      expect(challenge1).not.toEqual(challenge2);
    });
  });

  describe('startCallbackServer', () => {
    it('should start callback server on available port', async () => {
      const port = await oauthClient.startCallbackServer();
      
      expect(typeof port).toBe('number');
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
      
      oauthClient.stopCallbackServer();
    });
  });

  describe('stopCallbackServer', () => {
    it('should stop callback server gracefully', async () => {
      await oauthClient.startCallbackServer();
      
      expect(() => oauthClient.stopCallbackServer()).not.toThrow();
    });

    it('should not throw when stopping server that was never started', () => {
      expect(() => oauthClient.stopCallbackServer()).not.toThrow();
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      // Mock a token response
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'read:confluence-content.all write:confluence-content'
        })
      } as Response);
    });

    it('should throw error when no refresh token available', async () => {
      await expect(oauthClient.refreshAccessToken()).rejects.toThrow('No refresh token available');
    });

    it('should refresh token successfully with valid refresh token', async () => {
      // Simulate having tokens by deserializing state
      const mockState = {
        tokens: {
          access_token: 'old-access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      await oauthClient.refreshAccessToken();

      expect(mockFetch).toHaveBeenCalledWith('https://auth.atlassian.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          refresh_token: 'refresh-token'
        })
      });
    });

    it('should handle refresh token failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid refresh token'
      } as Response);

      const mockState = {
        tokens: {
          access_token: 'old-access-token',
          refresh_token: 'refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      await expect(oauthClient.refreshAccessToken()).rejects.toThrow('Token refresh failed: 400 Invalid refresh token');
    });
  });

  describe('getAuthHeaders', () => {
    it('should throw error when not authenticated', () => {
      expect(() => oauthClient.getAuthHeaders()).toThrow('No OAuth tokens available');
    });

    it('should return Bearer token headers when authenticated', () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      const headers = oauthClient.getAuthHeaders();

      expect(headers).toEqual({
        'Authorization': 'Bearer test-access-token',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    });
  });

  describe('getCloudId', () => {
    it('should throw error when no cloud ID available', () => {
      expect(() => oauthClient.getCloudId()).toThrow('No cloud ID available');
    });

    it('should return cloud ID when available', () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      expect(oauthClient.getCloudId()).toBe('test-cloud-id');
    });
  });

  describe('getDomainUrl', () => {
    it('should throw error when no domain URL available', () => {
      expect(() => oauthClient.getDomainUrl()).toThrow('No domain URL available');
    });

    it('should return domain URL when available', () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      expect(oauthClient.getDomainUrl()).toBe('https://test.atlassian.net');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no tokens or cloud ID', () => {
      expect(oauthClient.isAuthenticated()).toBe(false);
    });

    it('should return false when tokens but no cloud ID', () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: null,
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      expect(oauthClient.isAuthenticated()).toBe(false);
    });

    it('should return false when tokens and cloud ID but no domain URL', () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: null,
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      expect(oauthClient.isAuthenticated()).toBe(false);
    });

    it('should return true when tokens, cloud ID, and domain URL available', () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      expect(oauthClient.isAuthenticated()).toBe(true);
    });
  });

  describe('serialize and deserialize', () => {
    it('should serialize and deserialize state correctly', () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: {
          state: 'test-state',
          codeVerifier: 'test-verifier',
          codeChallenge: 'test-challenge',
          timestamp: Date.now()
        }
      };

      const serialized = JSON.stringify(mockState);
      oauthClient.deserialize(serialized);

      const reserialized = oauthClient.serialize();
      expect(JSON.parse(reserialized)).toEqual(mockState);
    });

    it('should handle invalid JSON gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      oauthClient.deserialize('invalid-json');
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to deserialize OAuth state:', expect.any(Error));
      expect(oauthClient.isAuthenticated()).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear all OAuth state', async () => {
      const mockState = {
        tokens: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer' as const,
          scope: 'read:confluence-content.all'
        },
        cloudId: 'test-cloud-id',
        domainUrl: 'https://test.atlassian.net',
        oauthState: null
      };
      oauthClient.deserialize(JSON.stringify(mockState));

      expect(oauthClient.isAuthenticated()).toBe(true);

      await oauthClient.clear();

      expect(oauthClient.isAuthenticated()).toBe(false);
      expect(() => oauthClient.getCloudId()).toThrow('No cloud ID available');
      expect(() => oauthClient.getDomainUrl()).toThrow('No domain URL available');
      expect(() => oauthClient.getAuthHeaders()).toThrow('No OAuth tokens available');
    });
  });
});