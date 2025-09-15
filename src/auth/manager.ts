import { isOAuthAuthenticated, getOAuthConfluenceClient } from "../tools/oauth.js";

class AuthManager {
  
  isAuthenticated(): boolean {
    return isOAuthAuthenticated();
  }

  getAuthHeaders(): Record<string, string> {
    if (!isOAuthAuthenticated()) {
      throw new Error('Not authenticated - OAuth required');
    }

    const oauthConfluenceClient = getOAuthConfluenceClient();
    if (!oauthConfluenceClient) {
      throw new Error('OAuth client not available');
    }

    return oauthConfluenceClient.getOAuthClient().getAuthHeaders();
  }

  getBaseUrl(): string {
    if (!isOAuthAuthenticated()) {
      throw new Error('Not authenticated - OAuth required');
    }

    const oauthConfluenceClient = getOAuthConfluenceClient();
    if (!oauthConfluenceClient) {
      throw new Error('OAuth client not available');
    }

    return `https://api.atlassian.com/ex/confluence/${oauthConfluenceClient.getOAuthClient().getCloudId()}`;
  }

  clear(): void {
    // OAuth clearing is handled by OAuth tools
  }
}

// Global instance
export const authManager = new AuthManager();