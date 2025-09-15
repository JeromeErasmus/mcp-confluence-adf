import { OAuthClient } from "../auth/oauth-client.js";
import { ConfluenceContent, ConfluenceSpace } from "../types/index.js";

export class OAuthConfluenceClient {
  private oauthClient: OAuthClient;

  constructor(oauthClient: OAuthClient) {
    this.oauthClient = oauthClient;
  }

  /**
   * Get OAuth client for direct access
   */
  getOAuthClient(): OAuthClient {
    return this.oauthClient;
  }

  /**
   * Test OAuth connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.oauthClient.ensureValidToken();
      
      // Test with a simple API call
      const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/rest/api/space`, {
        headers: this.oauthClient.getAuthHeaders()
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${await response.text()}` 
        };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Get Confluence content by ID
   */
  async getContent(pageId: string, expand: string[] = []): Promise<ConfluenceContent> {
    await this.oauthClient.ensureValidToken();
    
    const params = new URLSearchParams();
    if (expand.length > 0) {
      params.set('expand', expand.join(','));
    }

    const url = `https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/rest/api/content/${pageId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Create new Confluence content
   */
  async createContent(content: {
    type: string;
    title: string;
    space: { key: string };
    body: {
      atlas_doc_format: {
        value: string;
        representation: string;
      };
    };
    ancestors?: Array<{ id: string }>;
  }): Promise<ConfluenceContent> {
    await this.oauthClient.ensureValidToken();
    
    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/rest/api/content`, {
      method: 'POST',
      headers: this.oauthClient.getAuthHeaders(),
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Update existing Confluence content
   */
  async updateContent(pageId: string, content: {
    type: string;
    title: string;
    version: { number: number };
    body: {
      atlas_doc_format: {
        value: string;
        representation: string;
      };
    };
  }): Promise<ConfluenceContent> {
    await this.oauthClient.ensureValidToken();
    
    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/rest/api/content/${pageId}`, {
      method: 'PUT',
      headers: this.oauthClient.getAuthHeaders(),
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Delete Confluence content
   */
  async deleteContent(pageId: string): Promise<void> {
    await this.oauthClient.ensureValidToken();
    
    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/rest/api/content/${pageId}`, {
      method: 'DELETE',
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  }

  /**
   * Get Confluence spaces
   */
  async getSpaces(limit: number = 25): Promise<{ results: ConfluenceSpace[] }> {
    await this.oauthClient.ensureValidToken();
    
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/rest/api/space?${params}`, {
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Search Confluence content
   */
  async searchContent(query: string, limit: number = 25): Promise<{ results: ConfluenceContent[] }> {
    await this.oauthClient.ensureValidToken();
    
    const cqlQuery = `title ~ "${query}" OR text ~ "${query}"`;
    const params = new URLSearchParams({
      cql: cqlQuery,
      limit: limit.toString()
    });

    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/rest/api/content/search?${params}`, {
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }
}