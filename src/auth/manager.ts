import { AuthCredentials } from "../types/index.js";
import { isOAuthAuthenticated, getOAuthConfluenceClient } from "../tools/oauth.js";

export type AuthMethod = 'api-token' | 'oauth';

class AuthManager {
  private credentials: AuthCredentials | null = null;
  private authMethod: AuthMethod = 'api-token';

  setCredentials(credentials: AuthCredentials): void {
    this.credentials = credentials;
    this.authMethod = 'api-token';
  }

  getCredentials(): AuthCredentials | null {
    return this.credentials;
  }

  getAuthMethod(): AuthMethod {
    if (isOAuthAuthenticated()) {
      return 'oauth';
    }
    return this.authMethod;
  }

  isAuthenticated(): boolean {
    // Check OAuth first (preferred method)
    if (isOAuthAuthenticated()) {
      return true;
    }

    // Fallback to API token
    return this.credentials !== null && 
           this.credentials.baseUrl !== '' && 
           this.credentials.email !== '' &&
           this.credentials.apiToken !== '';
  }

  getAuthHeaders(): Record<string, string> {
    // Prefer OAuth if available
    if (isOAuthAuthenticated()) {
      const oauthConfluenceClient = getOAuthConfluenceClient();
      if (oauthConfluenceClient) {
        return oauthConfluenceClient.getOAuthClient().getAuthHeaders();
      }
    }

    // Fallback to API token
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }

    // Confluence uses Basic Auth with email:token format
    const auth = Buffer.from(`${this.credentials.email}:${this.credentials.apiToken}`).toString('base64');

    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  getBaseUrl(): string {
    // For OAuth, use the API gateway URL format
    if (isOAuthAuthenticated()) {
      const oauthConfluenceClient = getOAuthConfluenceClient();
      if (oauthConfluenceClient) {
        return `https://api.atlassian.com/ex/confluence/${oauthConfluenceClient.getOAuthClient().getCloudId()}`;
      }
    }

    // Fallback to direct instance URL for API token
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }
    return this.credentials.baseUrl;
  }

  clear(): void {
    this.credentials = null;
    this.authMethod = 'api-token';
  }
}

// Global instance
export const authManager = new AuthManager();