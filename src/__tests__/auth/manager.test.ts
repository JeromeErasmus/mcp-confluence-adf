import { authManager } from '../../auth/manager.js';
import { AuthCredentials } from '../../types/index.js';

describe('AuthManager', () => {
  beforeEach(() => {
    // Clear credentials before each test
    authManager.clear();
  });

  describe('setCredentials', () => {
    it('should store credentials correctly', () => {
      const credentials: AuthCredentials = {
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'test-token'
      };

      authManager.setCredentials(credentials);
      expect(authManager.getCredentials()).toEqual(credentials);
    });

    it('should overwrite existing credentials', () => {
      const oldCredentials: AuthCredentials = {
        baseUrl: 'https://old.atlassian.net',
        apiToken: 'old-token'
      };

      const newCredentials: AuthCredentials = {
        baseUrl: 'https://new.atlassian.net',
        apiToken: 'new-token'
      };

      authManager.setCredentials(oldCredentials);
      authManager.setCredentials(newCredentials);
      
      expect(authManager.getCredentials()).toEqual(newCredentials);
    });
  });

  describe('getCredentials', () => {
    it('should return null when no credentials are set', () => {
      expect(authManager.getCredentials()).toBeNull();
    });

    it('should return stored credentials', () => {
      const credentials: AuthCredentials = {
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'test-token'
      };

      authManager.setCredentials(credentials);
      expect(authManager.getCredentials()).toEqual(credentials);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no credentials are set', () => {
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should return false when baseUrl is empty', () => {
      const credentials: AuthCredentials = {
        baseUrl: '',
        apiToken: 'test-token'
      };

      authManager.setCredentials(credentials);
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should return false when apiToken is empty', () => {
      const credentials: AuthCredentials = {
        baseUrl: 'https://test.atlassian.net',
        apiToken: ''
      };

      authManager.setCredentials(credentials);
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should return true when both baseUrl and apiToken are provided', () => {
      const credentials: AuthCredentials = {
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'test-token'
      };

      authManager.setCredentials(credentials);
      expect(authManager.isAuthenticated()).toBe(true);
    });
  });

  describe('getAuthHeaders', () => {
    it('should throw error when not authenticated', () => {
      expect(() => authManager.getAuthHeaders()).toThrow('Not authenticated');
    });

    it('should return correct headers when authenticated', () => {
      const credentials: AuthCredentials = {
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'test-token'
      };

      authManager.setCredentials(credentials);
      const headers = authManager.getAuthHeaders();

      expect(headers).toEqual({
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    });
  });

  describe('getBaseUrl', () => {
    it('should throw error when not authenticated', () => {
      expect(() => authManager.getBaseUrl()).toThrow('Not authenticated');
    });

    it('should return baseUrl when authenticated', () => {
      const credentials: AuthCredentials = {
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'test-token'
      };

      authManager.setCredentials(credentials);
      expect(authManager.getBaseUrl()).toBe('https://test.atlassian.net');
    });
  });

  describe('clear', () => {
    it('should clear stored credentials', () => {
      const credentials: AuthCredentials = {
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'test-token'
      };

      authManager.setCredentials(credentials);
      expect(authManager.isAuthenticated()).toBe(true);

      authManager.clear();
      expect(authManager.getCredentials()).toBeNull();
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should not throw when clearing already empty credentials', () => {
      expect(() => authManager.clear()).not.toThrow();
      expect(authManager.getCredentials()).toBeNull();
    });
  });
});