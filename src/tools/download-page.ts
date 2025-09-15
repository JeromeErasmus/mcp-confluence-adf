import { z } from "zod";
import * as fs from "fs-extra";
import { authManager } from "../auth/manager.js";
import { ConfluenceClient } from "../client/confluence.js";
import { FileManager } from "../filemanager/index.js";
import { ADFConverter } from "../converter/index.js";
import { ToolHandler, ToolError, FileMetadata } from "../types/index.js";

const downloadSchema = z.object({
  pageId: z.string().min(1).describe("Confluence page ID to download"),
  targetDirectory: z.string().optional().describe("Target directory for downloaded file (optional)")
});

export function createDownloadPageTool(): ToolHandler<z.infer<typeof downloadSchema>> {
  return {
    name: "confluence_download_page",
    title: "Download Confluence Page",
    description: "Download a Confluence page as Markdown with metadata, converting from ADF format.",
    inputSchema: {
      type: "object",
      properties: {
        pageId: {
          type: "string",
          description: "Confluence page ID to download"
        },
        targetDirectory: {
          type: "string",
          description: "Target directory for downloaded file (optional)"
        }
      },
      required: ["pageId"]
    },
    handler: async (params) => {
      try {
        const { pageId, targetDirectory } = downloadSchema.parse(params);
        
        if (!authManager.isAuthenticated()) {
          throw new ToolError("Not authenticated. Please authenticate first using confluence_authenticate.");
        }
        
        // Fetch page content with ADF
        const client = new ConfluenceClient();
        const page = await client.getContent(pageId, ['body.atlas_doc_format', 'space', 'version']);
        
        if (!page.body?.atlas_doc_format?.value) {
          throw new ToolError(`Page ${pageId} does not have ADF content or is not accessible`);
        }
        
        // Parse ADF content
        let adfDocument;
        try {
          adfDocument = JSON.parse(page.body.atlas_doc_format.value);
        } catch (error) {
          throw new ToolError(`Failed to parse ADF content: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
        }
        
        // Create managed file
        const managedFile = await FileManager.createManagedFile(pageId, page.title, targetDirectory);
        
        // Convert ADF to Markdown with metadata
        const metadata: FileMetadata = {
          pageId: page.id,
          title: page.title,
          spaceKey: page.space.key,
          originalADF: page.body.atlas_doc_format.value
        };
        
        const markdown = ADFConverter.adfToMarkdown(adfDocument, metadata);
        
        // Write files
        await fs.writeFile(managedFile.filePath, markdown, 'utf-8');
        await fs.writeFile(managedFile.metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        
        const displayPath = FileManager.getDisplayPath(managedFile.filePath);
        
        return {
          content: [{
            type: "text",
            text: `Successfully downloaded page "${page.title}" (ID: ${pageId}) to ${displayPath}`
          }]
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ToolError(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        
        if (error instanceof ToolError) {
          throw error;
        }
        
        throw new ToolError(`Failed to download page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}