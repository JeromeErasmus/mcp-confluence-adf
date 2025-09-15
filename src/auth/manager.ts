import { isOAuthAuthenticated, getOAuthConfluenceClient } from "../tools/oauth.js";

export class AuthManager {
  
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

    try {
      return oauthConfluenceClient.getOAuthClient().getAuthHeaders();
    } catch (error) {
      throw new Error(`Failed to get OAuth headers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getCloudId(): string {
    if (!isOAuthAuthenticated()) {
      throw new Error('Not authenticated - OAuth required');
    }

    const oauthConfluenceClient = getOAuthConfluenceClient();
    if (!oauthConfluenceClient) {
      throw new Error('OAuth client not available');
    }

    try {
      return oauthConfluenceClient.getOAuthClient().getCloudId();
    } catch (error) {
      throw new Error(`Failed to get cloud ID: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getConfluenceClient() {
    if (!isOAuthAuthenticated()) {
      throw new Error('Not authenticated - OAuth required');
    }

    const oauthConfluenceClient = getOAuthConfluenceClient();
    if (!oauthConfluenceClient) {
      throw new Error('OAuth client not available');
    }

    return oauthConfluenceClient;
  }

  getBaseUrl(): string {
    if (!isOAuthAuthenticated()) {
      throw new Error('Not authenticated - OAuth required');
    }

    const oauthConfluenceClient = getOAuthConfluenceClient();
    if (!oauthConfluenceClient) {
      throw new Error('OAuth client not available');
    }

    try {
      return oauthConfluenceClient.getOAuthClient().getDomainUrl();
    } catch (error) {
      throw new Error(`Failed to get domain URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  clear(): void {
    // OAuth clearing is handled by OAuth tools
  }
}

// Global instance
export const authManager = new AuthManager();