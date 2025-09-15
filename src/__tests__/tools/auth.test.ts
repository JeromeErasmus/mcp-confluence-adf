import { createAuthTool } from '../../tools/auth.js';
import { authManager } from '../../auth/manager.js';
import { ConfluenceClient } from '../../client/confluence.js';
import { ToolError } from '../../types/index.js';

// Mock the auth manager
jest.mock('../../auth/manager.js', () => ({
  authManager: {
    setCredentials: jest.fn(),
    clear: jest.fn()
  }
}));

// Mock the ConfluenceClient
jest.mock('../../client/confluence.js');

describe('Auth Tool', () => {
  let authTool: ReturnType<typeof createAuthTool>;
  const mockedAuthManager = authManager as jest.Mocked<typeof authManager>;
  const MockedConfluenceClient = ConfluenceClient as jest.MockedClass<typeof ConfluenceClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    authTool = createAuthTool();
  });

  describe('tool configuration', () => {
    it('should have correct tool metadata', () => {
      expect(authTool.name).toBe('confluence_authenticate');
      expect(authTool.title).toBe('Authenticate with Confluence');
      expect(authTool.description).toBe('Authenticate with Confluence using API token. Required before using any other tools.');
    });

    it('should have correct input schema', () => {
      expect(authTool.inputSchema).toEqual({
        type: "object",
        properties: {
          baseUrl: {
            type: "string",
            description: "Confluence instance base URL (e.g., https://yourcompany.atlassian.net)"
          },
          email: {
            type: "string",
            description: "Your Atlassian account email address"
          },
          apiToken: {
            type: "string",
            description: "Confluence API token for authentication"
          }
        },
        required: ["baseUrl", "email", "apiToken"]
      });
    });
  });

  describe('handler', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const mockTestConnection = jest.fn().mockResolvedValue({ success: true });
      MockedConfluenceClient.prototype.testConnection = mockTestConnection;

      const params = {
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'valid-token'
      };

      const result = await authTool.handler(params);

      expect(mockedAuthManager.setCredentials).toHaveBeenCalledWith({
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'valid-token'
      });
      expect(mockTestConnection).toHaveBeenCalled();
      expect(result).toEqual({
        content: [{
          type: "text",
          text: "Successfully authenticated with Confluence at https://test.atlassian.net"
        }]
      });
    });

    it('should clean up trailing slashes from baseUrl', async () => {
      const mockTestConnection = jest.fn().mockResolvedValue({ success: true });
      MockedConfluenceClient.prototype.testConnection = mockTestConnection;

      const params = {
        baseUrl: 'https://test.atlassian.net///',
        email: 'test@example.com',
        apiToken: 'valid-token'
      };

      await authTool.handler(params);

      expect(mockedAuthManager.setCredentials).toHaveBeenCalledWith({
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'valid-token'
      });
    });

    it('should clear credentials and throw error when connection fails', async () => {
      const mockTestConnection = jest.fn().mockResolvedValue({ 
        success: false, 
        error: 'Invalid credentials' 
      });
      MockedConfluenceClient.prototype.testConnection = mockTestConnection;

      const params = {
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'invalid-token'
      };

      await expect(authTool.handler(params)).rejects.toThrow(ToolError);
      await expect(authTool.handler(params)).rejects.toThrow('Authentication failed: Invalid credentials');
      
      expect(mockedAuthManager.clear).toHaveBeenCalled();
    });

    it('should handle network errors during connection test', async () => {
      const mockTestConnection = jest.fn().mockRejectedValue(new Error('Network error'));
      MockedConfluenceClient.prototype.testConnection = mockTestConnection;

      const params = {
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'valid-token'
      };

      await expect(authTool.handler(params)).rejects.toThrow(ToolError);
      await expect(authTool.handler(params)).rejects.toThrow('Authentication failed: Network error');
      
      expect(mockedAuthManager.clear).toHaveBeenCalled();
    });

    it('should validate required parameters', async () => {
      const invalidParams = {
        baseUrl: '',
        email: 'test@example.com',
        apiToken: 'valid-token'
      };

      await expect(authTool.handler(invalidParams)).rejects.toThrow(ToolError);
      await expect(authTool.handler(invalidParams)).rejects.toThrow('Invalid parameters');
    });

    it('should validate baseUrl format', async () => {
      const invalidParams = {
        baseUrl: 'not-a-url',
        email: 'test@example.com',
        apiToken: 'valid-token'
      };

      await expect(authTool.handler(invalidParams)).rejects.toThrow(ToolError);
      await expect(authTool.handler(invalidParams)).rejects.toThrow('Invalid parameters');
    });

    it('should validate email format', async () => {
      const invalidParams = {
        baseUrl: 'https://test.atlassian.net',
        email: 'invalid-email',
        apiToken: 'valid-token'
      };

      await expect(authTool.handler(invalidParams)).rejects.toThrow(ToolError);
      await expect(authTool.handler(invalidParams)).rejects.toThrow('Invalid parameters');
    });

    it('should validate apiToken is not empty', async () => {
      const invalidParams = {
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: ''
      };

      await expect(authTool.handler(invalidParams)).rejects.toThrow(ToolError);
      await expect(authTool.handler(invalidParams)).rejects.toThrow('Invalid parameters');
    });

    it('should handle missing parameters', async () => {
      const invalidParams = {
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com'
        // missing apiToken
      };

      await expect(authTool.handler(invalidParams)).rejects.toThrow(ToolError);
      await expect(authTool.handler(invalidParams)).rejects.toThrow('Invalid parameters');
    });

    it('should handle unknown errors gracefully', async () => {
      const mockTestConnection = jest.fn().mockRejectedValue('Unknown error');
      MockedConfluenceClient.prototype.testConnection = mockTestConnection;

      const params = {
        baseUrl: 'https://test.atlassian.net',
        email: 'test@example.com',
        apiToken: 'valid-token'
      };

      await expect(authTool.handler(params)).rejects.toThrow(ToolError);
      await expect(authTool.handler(params)).rejects.toThrow('Authentication failed: Unknown error');
      
      expect(mockedAuthManager.clear).toHaveBeenCalled();
    });
  });
});