import { 
  createOAuthInitTool, 
  createOAuthCompleteTool, 
  createOAuthStatusTool, 
  createOAuthClearTool,
  getOAuthConfluenceClient,
  isOAuthAuthenticated
} from '../../tools/oauth.js';

// Mock dependencies
jest.mock('../../auth/oauth-client.js');
jest.mock('../../client/oauth-confluence.js');
jest.mock('../../auth/token-storage.js');
jest.mock('child_process');

import { OAuthClient } from '../../auth/oauth-client.js';
import { OAuthConfluenceClient } from '../../client/oauth-confluence.js';
import { exec } from 'child_process';

const mockOAuthClient = OAuthClient as jest.MockedClass<typeof OAuthClient>;
const mockOAuthConfluenceClient = OAuthConfluenceClient as jest.MockedClass<typeof OAuthConfluenceClient>;
const mockExec = exec as jest.MockedFunction<typeof exec>;

describe('OAuth Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global state
    (global as any).globalOAuthClient = null;
    (global as any).globalOAuthConfluenceClient = null;
  });

  describe('createOAuthInitTool', () => {
    it('should create OAuth init tool with correct schema and handler', () => {
      const tool = createOAuthInitTool();

      expect(tool.name).toBe('confluence_oauth_init');
      expect(tool.title).toBe('Initialize OAuth Authentication');
      expect(tool.description).toContain('OAuth 2.0 authentication flow');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeDefined();
    });

    it('should initialize OAuth client and start callback server', async () => {
      const mockStartCallbackServer = jest.fn().mockResolvedValue(3000);
      const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://auth.atlassian.com/authorize?test');

      mockOAuthClient.mockImplementation(() => ({
        startCallbackServer: mockStartCallbackServer,
        generateAuthUrl: mockGenerateAuthUrl
      } as any));

      const tool = createOAuthInitTool();
      const result = await tool.handler({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost:3000/oauth/callback'
      });

      expect(mockOAuthClient).toHaveBeenCalledTimes(2); // Once for port detection, once for final client
      expect(mockStartCallbackServer).toHaveBeenCalled();
      expect(mockGenerateAuthUrl).toHaveBeenCalled();
      expect(result.content[0].text).toContain('OAuth initialization successful!');
      expect(result.content[0].text).toContain('https://auth.atlassian.com/authorize?test');
      expect(result.content[0].text).toContain('http://localhost:3000/oauth/callback');
    });

    it('should handle OAuth initialization errors', async () => {
      mockOAuthClient.mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      const tool = createOAuthInitTool();
      
      await expect(tool.handler({
        clientId: 'test-client-id',
        clientSecret: 'test-secret'
      })).rejects.toThrow('Failed to initialize OAuth: Initialization failed');
    });

    it('should use default redirect URI when not provided', async () => {
      const mockStartCallbackServer = jest.fn().mockResolvedValue(3000);
      const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://auth.atlassian.com/authorize?test');

      mockOAuthClient.mockImplementation(() => ({
        startCallbackServer: mockStartCallbackServer,
        generateAuthUrl: mockGenerateAuthUrl
      } as any));

      const tool = createOAuthInitTool();
      await tool.handler({
        clientId: 'test-client-id',
        clientSecret: 'test-secret'
      });

      expect(mockOAuthClient).toHaveBeenCalledWith({
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost:0/oauth/callback'
      });
    });
  });

  describe('createOAuthCompleteTool', () => {
    it('should create OAuth complete tool with correct schema and handler', () => {
      const tool = createOAuthCompleteTool();

      expect(tool.name).toBe('confluence_oauth_complete');
      expect(tool.title).toBe('Complete OAuth Authentication');
      expect(tool.description).toContain('Complete the OAuth 2.0 authentication flow');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeDefined();
    });

    it('should complete OAuth flow successfully', async () => {
      const mockWaitForAuthCompletion = jest.fn().mockResolvedValue({ success: true });
      const mockStopCallbackServer = jest.fn();
      const mockGenerateAuthUrl = jest.fn().mockReturnValue('https://auth.atlassian.com/authorize?test');
      const mockGetCloudId = jest.fn().mockReturnValue('test-cloud-id');
      const mockGetOAuthClient = jest.fn().mockReturnValue({ getCloudId: mockGetCloudId });
      const mockTestConnection = jest.fn().mockResolvedValue({ success: true });

      // Mock global OAuth client
      (global as any).globalOAuthClient = {
        waitForAuthCompletion: mockWaitForAuthCompletion,
        stopCallbackServer: mockStopCallbackServer,
        generateAuthUrl: mockGenerateAuthUrl
      };

      mockOAuthConfluenceClient.mockImplementation(() => ({
        testConnection: mockTestConnection,
        getOAuthClient: mockGetOAuthClient
      } as any));

      // Mock exec for browser opening
      mockExec.mockImplementation((cmd: string, callback?: any) => {
        if (callback && typeof callback === 'function') {
          process.nextTick(() => callback(null, '', ''));
        }
        return {} as any; // Return mock ChildProcess
      });

      const tool = createOAuthCompleteTool();
      const result = await tool.handler({ openBrowser: true });

      expect(mockWaitForAuthCompletion).toHaveBeenCalled();
      expect(mockTestConnection).toHaveBeenCalled();
      expect(mockStopCallbackServer).toHaveBeenCalled();
      expect(result.content[0].text).toContain('OAuth Authentication Successful!');
      expect(result.content[0].text).toContain('test-cloud-id');
    });

    it('should handle OAuth not initialized error', async () => {
      (global as any).globalOAuthClient = null;

      const tool = createOAuthCompleteTool();
      
      await expect(tool.handler({ openBrowser: false }))
        .rejects.toThrow('OAuth not initialized. Please run \'confluence_oauth_init\' first.');
    });

    it('should handle OAuth authentication failure', async () => {
      const mockWaitForAuthCompletion = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'User denied access' 
      });
      const mockStopCallbackServer = jest.fn();

      (global as any).globalOAuthClient = {
        waitForAuthCompletion: mockWaitForAuthCompletion,
        stopCallbackServer: mockStopCallbackServer
      };

      const tool = createOAuthCompleteTool();
      
      await expect(tool.handler({ openBrowser: false }))
        .rejects.toThrow('OAuth authentication failed: User denied access');
      
      expect(mockStopCallbackServer).toHaveBeenCalled();
    });

    it('should handle connection test failure', async () => {
      const mockWaitForAuthCompletion = jest.fn().mockResolvedValue({ success: true });
      const mockStopCallbackServer = jest.fn();
      const mockTestConnection = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Connection failed' 
      });

      (global as any).globalOAuthClient = {
        waitForAuthCompletion: mockWaitForAuthCompletion,
        stopCallbackServer: mockStopCallbackServer
      };

      mockOAuthConfluenceClient.mockImplementation(() => ({
        testConnection: mockTestConnection
      } as any));

      const tool = createOAuthCompleteTool();
      
      await expect(tool.handler({ openBrowser: false }))
        .rejects.toThrow('Connection test failed: Connection failed');
      
      expect(mockStopCallbackServer).toHaveBeenCalled();
    });

    it('should not open browser when openBrowser is false', async () => {
      const mockWaitForAuthCompletion = jest.fn().mockResolvedValue({ success: true });
      const mockStopCallbackServer = jest.fn();
      const mockGetCloudId = jest.fn().mockReturnValue('test-cloud-id');
      const mockGetOAuthClient = jest.fn().mockReturnValue({ getCloudId: mockGetCloudId });
      const mockTestConnection = jest.fn().mockResolvedValue({ success: true });

      (global as any).globalOAuthClient = {
        waitForAuthCompletion: mockWaitForAuthCompletion,
        stopCallbackServer: mockStopCallbackServer
      };

      mockOAuthConfluenceClient.mockImplementation(() => ({
        testConnection: mockTestConnection,
        getOAuthClient: mockGetOAuthClient
      } as any));

      const tool = createOAuthCompleteTool();
      await tool.handler({ openBrowser: false });

      expect(mockExec).not.toHaveBeenCalled();
    });
  });

  describe('createOAuthStatusTool', () => {
    it('should create OAuth status tool with correct schema and handler', () => {
      const tool = createOAuthStatusTool();

      expect(tool.name).toBe('confluence_oauth_status');
      expect(tool.title).toBe('Check OAuth Status');
      expect(tool.description).toContain('Check the current OAuth authentication status');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeDefined();
    });

    it('should return not initialized when no OAuth client', async () => {
      (global as any).globalOAuthClient = null;

      const tool = createOAuthStatusTool();
      const result = await tool.handler({});

      expect(result.content[0].text).toContain('OAuth Not Initialized');
      expect(result.content[0].text).toContain('confluence_oauth_init');
    });

    it('should return not authenticated when OAuth client exists but not authenticated', async () => {
      const mockIsAuthenticated = jest.fn().mockReturnValue(false);

      (global as any).globalOAuthClient = {
        isAuthenticated: mockIsAuthenticated
      };

      const tool = createOAuthStatusTool();
      const result = await tool.handler({});

      expect(result.content[0].text).toContain('OAuth Initialized but Not Authenticated');
      expect(result.content[0].text).toContain('confluence_oauth_complete');
    });

    it('should return authenticated status when OAuth is active', async () => {
      const mockIsAuthenticated = jest.fn().mockReturnValue(true);
      const mockGetCloudId = jest.fn().mockReturnValue('test-cloud-id');
      const mockGetOAuthClient = jest.fn().mockReturnValue({ getCloudId: mockGetCloudId });
      const mockTestConnection = jest.fn().mockResolvedValue({ success: true });
      const mockGetStorageInfo = jest.fn().mockReturnValue({
        method: 'keychain',
        location: 'macOS Keychain (mcp-confluence-adf)'
      });

      (global as any).globalOAuthClient = {
        isAuthenticated: mockIsAuthenticated
      };

      (global as any).globalOAuthConfluenceClient = {
        testConnection: mockTestConnection,
        getOAuthClient: mockGetOAuthClient
      };

      // Mock token storage
      const { tokenStorage } = require('../../auth/token-storage.js');
      tokenStorage.getStorageInfo = mockGetStorageInfo;

      const tool = createOAuthStatusTool();
      const result = await tool.handler({});

      expect(result.content[0].text).toContain('OAuth Authentication Active');
      expect(result.content[0].text).toContain('Connected');
      expect(result.content[0].text).toContain('test-cloud-id');
      expect(result.content[0].text).toContain('Yes');
      expect(result.content[0].text).toContain('keychain');
    });

    it('should handle connection test failure in status check', async () => {
      const mockIsAuthenticated = jest.fn().mockReturnValue(true);
      const mockGetCloudId = jest.fn().mockReturnValue('test-cloud-id');
      const mockGetOAuthClient = jest.fn().mockReturnValue({ getCloudId: mockGetCloudId });
      const mockTestConnection = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'API error' 
      });
      const mockGetStorageInfo = jest.fn().mockReturnValue({
        method: 'file',
        location: '~/.mcp/confluence-adf/oauth-tokens.json'
      });

      (global as any).globalOAuthClient = {
        isAuthenticated: mockIsAuthenticated
      };

      (global as any).globalOAuthConfluenceClient = {
        testConnection: mockTestConnection,
        getOAuthClient: mockGetOAuthClient
      };

      const { tokenStorage } = require('../../auth/token-storage.js');
      tokenStorage.getStorageInfo = mockGetStorageInfo;

      const tool = createOAuthStatusTool();
      const result = await tool.handler({});

      expect(result.content[0].text).toContain('Connection Issue');
      expect(result.content[0].text).toContain('API error');
      expect(result.content[0].text).toContain('No');
    });
  });

  describe('createOAuthClearTool', () => {
    it('should create OAuth clear tool with correct schema and handler', () => {
      const tool = createOAuthClearTool();

      expect(tool.name).toBe('confluence_oauth_clear');
      expect(tool.title).toBe('Clear OAuth Authentication');
      expect(tool.description).toContain('Clear the current OAuth authentication and tokens');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeDefined();
    });

    it('should clear OAuth authentication successfully', async () => {
      const mockClear = jest.fn().mockResolvedValue(undefined);

      (global as any).globalOAuthClient = {
        clear: mockClear
      };

      (global as any).globalOAuthConfluenceClient = {};

      const tool = createOAuthClearTool();
      const result = await tool.handler({});

      expect(mockClear).toHaveBeenCalled();
      expect((global as any).globalOAuthClient).toBeNull();
      expect((global as any).globalOAuthConfluenceClient).toBeNull();
      expect(result.content[0].text).toContain('OAuth Authentication Cleared');
      expect(result.content[0].text).toContain('confluence_oauth_init');
    });

    it('should handle clear when no OAuth client exists', async () => {
      (global as any).globalOAuthClient = null;
      (global as any).globalOAuthConfluenceClient = null;

      const tool = createOAuthClearTool();
      const result = await tool.handler({});

      expect(result.content[0].text).toContain('OAuth Authentication Cleared');
    });

    it('should handle clear errors gracefully', async () => {
      const mockClear = jest.fn().mockRejectedValue(new Error('Clear failed'));

      (global as any).globalOAuthClient = {
        clear: mockClear
      };

      const tool = createOAuthClearTool();

      await expect(tool.handler({})).rejects.toThrow('Failed to clear OAuth authentication: Clear failed');
    });
  });

  describe('getOAuthConfluenceClient', () => {
    it('should return global OAuth Confluence client', () => {
      const mockClient = { test: 'client' };
      (global as any).globalOAuthConfluenceClient = mockClient;

      expect(getOAuthConfluenceClient()).toBe(mockClient);
    });

    it('should return null when no client exists', () => {
      (global as any).globalOAuthConfluenceClient = null;

      expect(getOAuthConfluenceClient()).toBeNull();
    });
  });

  describe('isOAuthAuthenticated', () => {
    it('should return true when OAuth client is authenticated', () => {
      const mockIsAuthenticated = jest.fn().mockReturnValue(true);
      (global as any).globalOAuthClient = {
        isAuthenticated: mockIsAuthenticated
      };

      expect(isOAuthAuthenticated()).toBe(true);
      expect(mockIsAuthenticated).toHaveBeenCalled();
    });

    it('should return false when OAuth client is not authenticated', () => {
      const mockIsAuthenticated = jest.fn().mockReturnValue(false);
      (global as any).globalOAuthClient = {
        isAuthenticated: mockIsAuthenticated
      };

      expect(isOAuthAuthenticated()).toBe(false);
    });

    it('should return false when no OAuth client exists', () => {
      (global as any).globalOAuthClient = null;

      expect(isOAuthAuthenticated()).toBe(false);
    });
  });
});