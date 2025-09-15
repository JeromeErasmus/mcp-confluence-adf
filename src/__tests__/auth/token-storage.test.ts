import { TokenStorage } from '../../auth/token-storage.js';
import { StoredOAuthData } from '../../auth/token-storage.js';
import * as keytar from 'keytar';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

// Mock dependencies
jest.mock('keytar');
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('os');

const mockKeytar = keytar as jest.Mocked<typeof keytar>;
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockHomedir = homedir as jest.MockedFunction<typeof homedir>;

describe('TokenStorage', () => {
  let tokenStorage: TokenStorage;
  
  const mockStoredData: StoredOAuthData = {
    tokens: {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read:confluence-content.all write:confluence-content'
    },
    cloudId: 'test-cloud-id',
    domainUrl: 'https://test.atlassian.net',
    oauthState: {
      state: 'test-state',
      codeVerifier: 'test-verifier',
      codeChallenge: 'test-challenge',
      timestamp: Date.now()
    },
    lastUpdated: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHomedir.mockReturnValue('/home/user');
    // Don't create new instance each time to avoid constructor issues
  });

  describe('constructor', () => {
    beforeEach(() => {
      mockHomedir.mockReturnValue('/home/user');
    });

    it('should test keychain access and set useKeychain to true on success', async () => {
      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValue('test');
      mockKeytar.deletePassword.mockResolvedValue(true);

      tokenStorage = new TokenStorage();

      // Allow time for async keychain test
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockKeytar.setPassword).toHaveBeenCalledWith('mcp-confluence-adf', 'test', 'test');
      expect(mockKeytar.getPassword).toHaveBeenCalledWith('mcp-confluence-adf', 'test');
      expect(mockKeytar.deletePassword).toHaveBeenCalledWith('mcp-confluence-adf', 'test');
    });

    it('should fall back to file storage when keychain fails', async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error('Keychain not available'));
      mockExistsSync.mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      tokenStorage = new TokenStorage();

      // Allow time for async keychain test
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith('Keychain not available, falling back to file storage');
      expect(mockMkdirSync).toHaveBeenCalledWith('/home/user/.mcp/confluence-adf', { recursive: true });

      consoleSpy.mockRestore();
    });
  });

  describe('store', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should store data in keychain when available', async () => {
      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValue('test');
      mockKeytar.deletePassword.mockResolvedValue(true);

      // Create new storage to trigger keychain success
      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      await storage.store(mockStoredData);

      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        'mcp-confluence-adf',
        'oauth-tokens',
        JSON.stringify({
          ...mockStoredData,
          lastUpdated: 1234567890
        })
      );
    });

    it('should fall back to file storage when keychain store fails', async () => {
      mockKeytar.setPassword.mockResolvedValueOnce(); // First call (test) succeeds
      mockKeytar.getPassword.mockResolvedValueOnce('test');
      mockKeytar.deletePassword.mockResolvedValueOnce(true);
      mockKeytar.setPassword.mockRejectedValueOnce(new Error('Keychain store failed')); // Store call fails

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      await storage.store(mockStoredData);

      expect(consoleSpy).toHaveBeenCalledWith('Failed to store in keychain, falling back to file storage:', expect.any(Error));
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/home/user/.mcp/confluence-adf/oauth-tokens.json',
        JSON.stringify({
          ...mockStoredData,
          lastUpdated: 1234567890
        }),
        { mode: 0o600 }
      );

      consoleSpy.mockRestore();
    });

    it('should store data in file when keychain not available', async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error('No keychain'));
      mockExistsSync.mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      await storage.store(mockStoredData);

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/home/user/.mcp/confluence-adf/oauth-tokens.json',
        JSON.stringify({
          ...mockStoredData,
          lastUpdated: 1234567890
        }),
        { mode: 0o600 }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('retrieve', () => {
    it('should retrieve data from keychain when available', async () => {
      const serializedData = JSON.stringify(mockStoredData);
      
      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValueOnce('test'); // Test call
      mockKeytar.deletePassword.mockResolvedValue(true);
      mockKeytar.getPassword.mockResolvedValueOnce(serializedData); // Retrieve call

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await storage.retrieve();

      expect(mockKeytar.getPassword).toHaveBeenCalledWith('mcp-confluence-adf', 'oauth-tokens');
      expect(result).toEqual(mockStoredData);
    });

    it('should fall back to file storage when keychain retrieve fails', async () => {
      const serializedData = JSON.stringify(mockStoredData);

      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValueOnce('test'); // Test call
      mockKeytar.deletePassword.mockResolvedValue(true);
      mockKeytar.getPassword.mockRejectedValueOnce(new Error('Keychain retrieve failed')); // Retrieve call fails
      
      mockExistsSync.mockReturnValue(true);
      mockReadFile.mockResolvedValue(serializedData);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await storage.retrieve();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to retrieve from keychain, falling back to file storage:', expect.any(Error));
      expect(mockReadFile).toHaveBeenCalledWith('/home/user/.mcp/confluence-adf/oauth-tokens.json', 'utf8');
      expect(result).toEqual(mockStoredData);

      consoleSpy.mockRestore();
    });

    it('should retrieve data from file when keychain not available', async () => {
      const serializedData = JSON.stringify(mockStoredData);

      mockKeytar.setPassword.mockRejectedValue(new Error('No keychain'));
      mockExistsSync.mockReturnValueOnce(false); // For initial setup
      mockExistsSync.mockReturnValueOnce(true); // For file exists check
      mockReadFile.mockResolvedValue(serializedData);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await storage.retrieve();

      expect(mockReadFile).toHaveBeenCalledWith('/home/user/.mcp/confluence-adf/oauth-tokens.json', 'utf8');
      expect(result).toEqual(mockStoredData);

      consoleSpy.mockRestore();
    });

    it('should return null when no data found', async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error('No keychain'));
      mockExistsSync.mockReturnValueOnce(false); // For initial setup
      mockExistsSync.mockReturnValueOnce(false); // For file exists check

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await storage.retrieve();

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON gracefully', async () => {
      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValueOnce('test'); // Test call
      mockKeytar.deletePassword.mockResolvedValue(true);
      mockKeytar.getPassword.mockResolvedValueOnce('invalid-json'); // Retrieve call

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockClear = jest.spyOn(TokenStorage.prototype, 'clear').mockResolvedValue();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await storage.retrieve();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored OAuth data:', expect.any(Error));
      expect(mockClear).toHaveBeenCalled();
      expect(result).toBeNull();

      consoleSpy.mockRestore();
      mockClear.mockRestore();
    });

    it('should clear invalid stored data', async () => {
      const invalidData = { invalid: 'data' };
      const serializedData = JSON.stringify(invalidData);

      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValueOnce('test'); // Test call
      mockKeytar.deletePassword.mockResolvedValue(true);
      mockKeytar.getPassword.mockResolvedValueOnce(serializedData); // Retrieve call

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockClear = jest.spyOn(TokenStorage.prototype, 'clear').mockResolvedValue();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await storage.retrieve();

      expect(consoleSpy).toHaveBeenCalledWith('Invalid stored OAuth data, clearing...');
      expect(mockClear).toHaveBeenCalled();
      expect(result).toBeNull();

      consoleSpy.mockRestore();
      mockClear.mockRestore();
    });

    it('should handle file read errors', async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error('No keychain'));
      mockExistsSync.mockReturnValueOnce(false); // For initial setup
      mockExistsSync.mockReturnValueOnce(true); // For file exists check
      mockReadFile.mockRejectedValue(new Error('File read error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const result = await storage.retrieve();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to read token file:', expect.any(Error));
      expect(result).toBeNull();

      consoleSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear keychain and file storage', async () => {
      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValue('test');
      mockKeytar.deletePassword.mockResolvedValue(true);
      mockExistsSync.mockReturnValue(true);

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      await storage.clear();

      expect(mockKeytar.deletePassword).toHaveBeenCalledWith('mcp-confluence-adf', 'oauth-tokens');
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/home/user/.mcp/confluence-adf/oauth-tokens.json',
        '',
        { mode: 0o600 }
      );
    });

    it('should ignore keychain clear errors', async () => {
      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValue('test');
      mockKeytar.deletePassword.mockResolvedValueOnce(true); // Test call
      mockKeytar.deletePassword.mockRejectedValueOnce(new Error('Clear failed')); // Clear call
      mockExistsSync.mockReturnValue(true);

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      await expect(storage.clear()).resolves.not.toThrow();

      expect(mockWriteFile).toHaveBeenCalledWith(
        '/home/user/.mcp/confluence-adf/oauth-tokens.json',
        '',
        { mode: 0o600 }
      );
    });

    it('should ignore file clear errors', async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error('No keychain'));
      mockExistsSync.mockReturnValueOnce(false); // For initial setup
      mockExistsSync.mockReturnValueOnce(true); // For file exists check
      mockWriteFile.mockRejectedValue(new Error('File write error'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      await expect(storage.clear()).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return true when no tokens', () => {
      const data: StoredOAuthData = {
        tokens: null,
        cloudId: null,
        oauthState: null,
        lastUpdated: 999000
      };

      expect(tokenStorage.isTokenExpired(data)).toBe(true);
    });

    it('should return true when no lastUpdated', () => {
      const data: StoredOAuthData = {
        tokens: mockStoredData.tokens,
        cloudId: 'test-cloud-id',
        oauthState: null,
        lastUpdated: 0
      };

      expect(tokenStorage.isTokenExpired(data)).toBe(true);
    });

    it('should return true when token is expired', () => {
      const data: StoredOAuthData = {
        tokens: {
          ...mockStoredData.tokens!,
          expires_in: 3600 // 1 hour
        },
        cloudId: 'test-cloud-id',
        oauthState: null,
        lastUpdated: 1000000 - 3900000 // More than 1 hour + 5 min buffer ago
      };

      expect(tokenStorage.isTokenExpired(data)).toBe(true);
    });

    it('should return false when token is still valid', () => {
      const data: StoredOAuthData = {
        tokens: {
          ...mockStoredData.tokens!,
          expires_in: 3600 // 1 hour
        },
        cloudId: 'test-cloud-id',
        oauthState: null,
        lastUpdated: 1000000 - 1800000 // 30 minutes ago (within 1 hour - 5 min buffer)
      };

      expect(tokenStorage.isTokenExpired(data)).toBe(false);
    });
  });

  describe('getStorageInfo', () => {
    it('should return keychain info when keychain is available', async () => {
      mockKeytar.setPassword.mockResolvedValue();
      mockKeytar.getPassword.mockResolvedValue('test');
      mockKeytar.deletePassword.mockResolvedValue(true);

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const info = storage.getStorageInfo();

      expect(info).toEqual({
        method: 'keychain',
        location: 'macOS Keychain (mcp-confluence-adf)'
      });
    });

    it('should return file info when keychain not available', async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error('No keychain'));
      mockExistsSync.mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const storage = new TokenStorage();
      await new Promise(resolve => setTimeout(resolve, 0));

      const info = storage.getStorageInfo();

      expect(info).toEqual({
        method: 'file',
        location: '/home/user/.mcp/confluence-adf/oauth-tokens.json'
      });

      consoleSpy.mockRestore();
    });
  });

  describe('isValidStoredData', () => {
    it('should return true for valid data', () => {
      const storage = new TokenStorage();
      // Access private method via type assertion
      const isValid = (storage as any).isValidStoredData(mockStoredData);

      expect(isValid).toBe(true);
    });

    it('should return false for null data', () => {
      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData(null);

      expect(isValid).toBe(false);
    });

    it('should return false for non-object data', () => {
      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData('string');

      expect(isValid).toBe(false);
    });

    it('should return false for invalid tokens', () => {
      const invalidData = {
        ...mockStoredData,
        tokens: { invalid: 'token' }
      };

      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData(invalidData);

      expect(isValid).toBe(false);
    });

    it('should return false for invalid cloudId', () => {
      const invalidData = {
        ...mockStoredData,
        cloudId: 123
      };

      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData(invalidData);

      expect(isValid).toBe(false);
    });

    it('should return false for invalid lastUpdated', () => {
      const invalidData = {
        ...mockStoredData,
        lastUpdated: 'invalid'
      };

      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData(invalidData);

      expect(isValid).toBe(false);
    });

    it('should return true for null tokens', () => {
      const validData = {
        ...mockStoredData,
        tokens: null
      };

      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData(validData);

      expect(isValid).toBe(true);
    });

    it('should return true for null cloudId', () => {
      const validData = {
        ...mockStoredData,
        cloudId: null
      };

      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData(validData);

      expect(isValid).toBe(true);
    });

    it('should return true for null oauthState', () => {
      const validData = {
        ...mockStoredData,
        oauthState: null
      };

      const storage = new TokenStorage();
      const isValid = (storage as any).isValidStoredData(validData);

      expect(isValid).toBe(true);
    });
  });
});