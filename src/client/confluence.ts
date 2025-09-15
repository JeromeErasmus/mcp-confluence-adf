import { authManager } from "../auth/manager.js";
import { ConfluenceContent, ConfluenceSpace } from "../types/index.js";

export class ConfluenceClient {
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use Confluence-specific API endpoint
      const response = await fetch(`${authManager.getBaseUrl()}/wiki/rest/api/user/current`, {
        headers: authManager.getAuthHeaders()
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

  async getContent(pageId: string, expand: string[] = []): Promise<ConfluenceContent> {
    const params = new URLSearchParams();
    if (expand.length > 0) {
      params.set('expand', expand.join(','));
    }

    const url = `${authManager.getBaseUrl()}/wiki/rest/api/content/${pageId}${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: authManager.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

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
    const response = await fetch(`${authManager.getBaseUrl()}/wiki/rest/api/content`, {
      method: 'POST',
      headers: authManager.getAuthHeaders(),
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

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
    const response = await fetch(`${authManager.getBaseUrl()}/wiki/rest/api/content/${pageId}`, {
      method: 'PUT',
      headers: authManager.getAuthHeaders(),
      body: JSON.stringify(content)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async deleteContent(pageId: string): Promise<void> {
    const response = await fetch(`${authManager.getBaseUrl()}/wiki/rest/api/content/${pageId}`, {
      method: 'DELETE',
      headers: authManager.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  }

  async getSpaces(limit: number = 25): Promise<{ results: ConfluenceSpace[] }> {
    const params = new URLSearchParams({
      limit: limit.toString()
    });

    const response = await fetch(`${authManager.getBaseUrl()}/wiki/rest/api/space?${params}`, {
      headers: authManager.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async searchContent(query: string, limit: number = 25): Promise<{ results: ConfluenceContent[] }> {
    const cqlQuery = `title ~ "${query}" OR text ~ "${query}"`;
    const params = new URLSearchParams({
      cql: cqlQuery,
      limit: limit.toString()
    });

    const response = await fetch(`${authManager.getBaseUrl()}/wiki/rest/api/content/search?${params}`, {
      headers: authManager.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }
}