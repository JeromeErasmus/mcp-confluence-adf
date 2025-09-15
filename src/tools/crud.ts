import { z } from "zod";
import { authManager } from "../auth/manager.js";
import { ConfluenceClient } from "../client/confluence.js";
import { ToolHandler, ToolError } from "../types/index.js";

// Get Page tool
const getPageSchema = z.object({
  pageId: z.string().min(1).describe("Confluence page ID to retrieve")
});

function createGetPageTool(): ToolHandler<z.infer<typeof getPageSchema>> {
  return {
    name: "confluence_get_page",
    title: "Get Confluence Page Info",
    description: "Retrieve basic information about a Confluence page (metadata only, not content).",
    inputSchema: {
      type: "object",
      properties: {
        pageId: {
          type: "string",
          description: "Confluence page ID to retrieve"
        }
      },
      required: ["pageId"]
    },
    handler: async (params) => {
      try {
        const { pageId } = getPageSchema.parse(params);
        
        if (!authManager.isAuthenticated()) {
          throw new ToolError("Not authenticated. Please authenticate first using confluence_authenticate.");
        }
        
        const client = new ConfluenceClient();
        const page = await client.getContent(pageId, ['space', 'version']);
        
        return {
          content: [{
            type: "text",
            text: `Page Information:
- ID: ${page.id}
- Title: ${page.title}
- Space: ${page.space.name} (${page.space.key})
- Version: ${page.version.number}
- Last Updated: ${page.version.when}
- URL: ${authManager.getBaseUrl()}${page._links.webui}`
          }]
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ToolError(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        
        throw new ToolError(`Failed to get page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

// Delete Page tool
const deletePageSchema = z.object({
  pageId: z.string().min(1).describe("Confluence page ID to delete")
});

function createDeletePageTool(): ToolHandler<z.infer<typeof deletePageSchema>> {
  return {
    name: "confluence_delete_page",
    title: "Delete Confluence Page",
    description: "Delete a Confluence page permanently.",
    inputSchema: {
      type: "object",
      properties: {
        pageId: {
          type: "string",
          description: "Confluence page ID to delete"
        }
      },
      required: ["pageId"]
    },
    handler: async (params) => {
      try {
        const { pageId } = deletePageSchema.parse(params);
        
        if (!authManager.isAuthenticated()) {
          throw new ToolError("Not authenticated. Please authenticate first using confluence_authenticate.");
        }
        
        const client = new ConfluenceClient();
        
        // Get page info before deletion
        const page = await client.getContent(pageId, ['space']);
        
        // Delete the page
        await client.deleteContent(pageId);
        
        return {
          content: [{
            type: "text",
            text: `Successfully deleted page "${page.title}" (ID: ${pageId}) from space ${page.space.key}`
          }]
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ToolError(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        
        throw new ToolError(`Failed to delete page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

// List Spaces tool
const listSpacesSchema = z.object({
  limit: z.number().min(1).max(100).default(25).describe("Maximum number of spaces to return")
});

function createListSpacesTool(): ToolHandler<z.infer<typeof listSpacesSchema>> {
  return {
    name: "confluence_list_spaces",
    title: "List Confluence Spaces",
    description: "List available Confluence spaces.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of spaces to return (1-100, default: 25)"
        }
      }
    },
    handler: async (params) => {
      try {
        const { limit } = listSpacesSchema.parse(params);
        
        if (!authManager.isAuthenticated()) {
          throw new ToolError("Not authenticated. Please authenticate first using confluence_authenticate.");
        }
        
        const client = new ConfluenceClient();
        const result = await client.getSpaces(limit);
        
        if (result.results.length === 0) {
          return {
            content: [{
              type: "text",
              text: "No spaces found or no access to any spaces."
            }]
          };
        }
        
        const spacesList = result.results.map(space => {
          const description = space.description?.plain?.value || 'No description';
          return `- **${space.name}** (${space.key})
  Description: ${description}
  URL: ${authManager.getBaseUrl()}${space._links.webui}`;
        }).join('\n\n');
        
        return {
          content: [{
            type: "text",
            text: `Found ${result.results.length} spaces:\n\n${spacesList}`
          }]
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ToolError(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        
        throw new ToolError(`Failed to list spaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

export function createCrudTools(): ToolHandler[] {
  return [
    createGetPageTool(),
    createDeletePageTool(),
    createListSpacesTool()
  ];
}