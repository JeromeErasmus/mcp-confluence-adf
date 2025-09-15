import { AuthCredentials } from "../types/index.js";

class AuthManager {
  private credentials: AuthCredentials | null = null;

  setCredentials(credentials: AuthCredentials): void {
    this.credentials = credentials;
  }

  getCredentials(): AuthCredentials | null {
    return this.credentials;
  }

  isAuthenticated(): boolean {
    return this.credentials !== null && 
           this.credentials.baseUrl !== '' && 
           this.credentials.email !== '' &&
           this.credentials.apiToken !== '';
  }

  getAuthHeaders(): Record<string, string> {
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
    if (!this.credentials) {
      throw new Error('Not authenticated');
    }
    return this.credentials.baseUrl;
  }

  clear(): void {
    this.credentials = null;
  }
}

// Global instance
export const authManager = new AuthManager();