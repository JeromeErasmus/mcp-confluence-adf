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
      
      // Test with a simple API call using V2 API
      const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/api/v2/spaces`, {
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

    const url = `https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/api/v2/pages/${pageId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Create new Confluence content using V2 API
   */
  async createContent(content: {
    type: string;
    title: string;
    spaceKey?: string;
    spaceId?: string;
    body: {
      atlas_doc_format: {
        value: string;
        representation: string;
      };
    };
    parentId?: string;
  }): Promise<ConfluenceContent> {
    await this.oauthClient.ensureValidToken();
    
    // Convert to V2 API format
    const v2Content = {
      spaceId: content.spaceId,
      status: 'current',
      title: content.title,
      body: {
        representation: 'atlas_doc_format',
        value: content.body.atlas_doc_format.value
      },
      ...(content.parentId && { parentId: content.parentId })
    };
    
    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/api/v2/pages`, {
      method: 'POST',
      headers: this.oauthClient.getAuthHeaders(),
      body: JSON.stringify(v2Content)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Update existing Confluence content using V2 API
   */
  async updateContent(pageId: string, content: {
    type?: string;
    title: string;
    version: { number: number };
    spaceId?: string;
    body: {
      atlas_doc_format: {
        value: string;
        representation: string;
      };
    };
  }): Promise<ConfluenceContent> {
    await this.oauthClient.ensureValidToken();
    
    // Convert to V2 API format
    const v2Content = {
      id: pageId,
      status: 'current',
      title: content.title,
      body: {
        representation: 'atlas_doc_format',
        value: content.body.atlas_doc_format.value
      },
      version: content.version,
      ...(content.spaceId && { spaceId: content.spaceId })
    };
    
    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/api/v2/pages/${pageId}`, {
      method: 'PUT',
      headers: this.oauthClient.getAuthHeaders(),
      body: JSON.stringify(v2Content)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Delete Confluence content using V2 API
   */
  async deleteContent(pageId: string): Promise<void> {
    await this.oauthClient.ensureValidToken();
    
    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/api/v2/pages/${pageId}`, {
      method: 'DELETE',
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  }

  /**
   * Get Confluence spaces using V2 API
   */
  async getSpaces(limit: number = 25): Promise<{ results: ConfluenceSpace[] }> {
    await this.oauthClient.ensureValidToken();
    
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/api/v2/spaces?${params}`, {
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Search Confluence content using V2 API
   */
  async searchContent(query: string, limit: number = 25): Promise<{ results: ConfluenceContent[] }> {
    await this.oauthClient.ensureValidToken();
    
    const params = new URLSearchParams({
      title: query, // V2 API uses simple title search
      limit: limit.toString()
    });

    // Note: V2 API doesn't have direct CQL search, using simpler title search
    const response = await fetch(`https://api.atlassian.com/ex/confluence/${this.oauthClient.getCloudId()}/wiki/api/v2/pages?${params}`, {
      headers: this.oauthClient.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }
}