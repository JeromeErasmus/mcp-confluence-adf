import { z } from "zod";
import { authManager } from "../auth/manager.js";
import { ConfluenceClient } from "../client/confluence.js";
import { ToolHandler, ToolError } from "../types/index.js";

// Search Content tool
const searchSchema = z.object({
  query: z.string().min(1).describe("Search query to find content"),
  limit: z.number().min(1).max(100).default(25).describe("Maximum number of results to return")
});

function createSearchTool(): ToolHandler<z.infer<typeof searchSchema>> {
  return {
    name: "confluence_search",
    title: "Search Confluence Content",
    description: "Search for Confluence pages and content using text queries.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find content"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (1-100, default: 25)"
        }
      },
      required: ["query"]
    },
    handler: async (params) => {
      try {
        const { query, limit } = searchSchema.parse(params);
        
        if (!authManager.isAuthenticated()) {
          throw new ToolError("Not authenticated. Please authenticate first using confluence_authenticate.");
        }
        
        const client = new ConfluenceClient();
        const result = await client.searchContent(query, limit);
        
        if (result.results.length === 0) {
          return {
            content: [{
              type: "text",
              text: `No results found for query: "${query}"`
            }]
          };
        }
        
        const resultsList = result.results.map(page => {
          return `- **${page.title}** (ID: ${page.id})
  Space: ${page.space.name} (${page.space.key})
  Type: ${page.type}
  URL: ${authManager.getBaseUrl()}${page._links.webui}`;
        }).join('\n\n');
        
        return {
          content: [{
            type: "text",
            text: `Found ${result.results.length} results for "${query}":\n\n${resultsList}`
          }]
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ToolError(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        
        throw new ToolError(`Failed to search content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

export function createSearchTools(): ToolHandler[] {
  return [
    createSearchTool()
  ];
}