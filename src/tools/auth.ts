import { z } from "zod";
import { authManager } from "../auth/manager.js";
import { ConfluenceClient } from "../client/confluence.js";
import { ToolHandler, ToolError } from "../types/index.js";

const authSchema = z.object({
  baseUrl: z.string().url().describe("Confluence instance base URL (e.g., https://yourcompany.atlassian.net)"),
  email: z.string().email().describe("Your Atlassian account email address"),
  apiToken: z.string().min(1).describe("Confluence API token for authentication")
});

export function createAuthTool(): ToolHandler<z.infer<typeof authSchema>> {
  return {
    name: "confluence_authenticate",
    title: "Authenticate with Confluence",
    description: "Authenticate with Confluence using API token. Required before using any other tools.",
    inputSchema: {
      baseUrl: z.string().url().describe("Confluence instance base URL (e.g., https://yourcompany.atlassian.net)"),
      email: z.string().email().describe("Your Atlassian account email address"),
      apiToken: z.string().min(1).describe("Confluence API token for authentication")
    },
    handler: async ({ baseUrl, email, apiToken }) => {
      try {
        // Clean up base URL
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        
        // Set credentials
        authManager.setCredentials({
          baseUrl: cleanBaseUrl,
          email,
          apiToken
        });
        
        // Test connection
        const client = new ConfluenceClient();
        const result = await client.testConnection();
        
        if (!result.success) {
          authManager.clear();
          throw new ToolError(`Authentication failed: ${result.error}`);
        }
        
        return {
          content: [{
            type: "text",
            text: `Successfully authenticated with Confluence at ${cleanBaseUrl}`
          }]
        };
      } catch (error) {
        authManager.clear();
        
        if (error instanceof z.ZodError) {
          throw new ToolError(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        
        if (error instanceof ToolError) {
          throw error;
        }
        
        throw new ToolError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}