import { z } from "zod";
import * as fs from "fs-extra";
import { readFile } from "fs/promises";
import { authManager } from "../auth/manager.js";
import { ConfluenceClient } from "../client/confluence.js";
import { FileManager } from "../filemanager/index.js";
import { ADFConverter } from "../converter/index.js";
import { ToolHandler, ToolError, FileMetadata } from "../types/index.js";

const uploadSchema = z.object({
  filePath: z.string().min(1).describe("Path to the Markdown file to upload"),
  spaceKey: z.string().optional().describe("Target space key (required for new pages)"),
  parentPageId: z.string().optional().describe("Parent page ID for new pages (optional)")
});

export function createUploadPageTool(): ToolHandler<z.infer<typeof uploadSchema>> {
  return {
    name: "confluence_upload_page",
    title: "Upload Page to Confluence",
    description: "Upload a Markdown file to Confluence, converting to ADF format. Updates existing page if file contains page ID, creates new page otherwise.",
    inputSchema: {
      filePath: z.string().min(1).describe("Path to the Markdown file to upload"),
      spaceKey: z.string().optional().describe("Target space key (required for new pages)"),
      parentPageId: z.string().optional().describe("Parent page ID for new pages (optional)")
    },
    handler: async ({ filePath, spaceKey, parentPageId }) => {
      try {
        
        if (!authManager.isAuthenticated()) {
          throw new ToolError("Not authenticated. Please authenticate first using confluence_authenticate.");
        }
        
        // Check if file exists
        if (!await fs.pathExists(filePath)) {
          throw new ToolError(`File not found: ${filePath}`);
        }
        
        // Read markdown content
        const markdownContent = await readFile(filePath, 'utf-8');
        
        // Convert markdown to ADF
        const { adf, metadata } = ADFConverter.markdownToADF(markdownContent);
        
        // Extract page ID from filename or metadata
        const pageIdFromFilename = FileManager.extractPageIdFromFilename(filePath);
        const existingPageId = pageIdFromFilename || (metadata as FileMetadata)?.pageId;
        
        const client = new ConfluenceClient();
        
        if (existingPageId) {
          // Update existing page
          try {
            // Get current page to get version
            const currentPage = await client.getContent(existingPageId, ['version']);
            
            // Extract title from markdown (first heading or from metadata)
            let title = (metadata as FileMetadata)?.title;
            if (!title) {
              const titleMatch = markdownContent.match(/^#+\s+(.+)$/m);
              title = titleMatch?.[1] || 'Untitled';
            }
            
            const updatedPage = await client.updateContent(existingPageId, {
              type: 'page',
              title,
              version: { number: currentPage.version.number + 1 },
              body: {
                atlas_doc_format: {
                  value: JSON.stringify(adf),
                  representation: 'atlas_doc_format'
                }
              }
            });
            
            // Update metadata file if it exists
            const metadataPath = filePath.replace(/\.md$/, '.meta.json');
            if (await fs.pathExists(metadataPath)) {
              const updatedMetadata: FileMetadata = {
                pageId: updatedPage.id,
                title: updatedPage.title,
                spaceKey: updatedPage.space.key,
                originalADF: JSON.stringify(adf)
              };
              await fs.outputFile(metadataPath, JSON.stringify(updatedMetadata, null, 2), 'utf-8');
            }
            
            return {
              content: [{
                type: "text",
                text: `Successfully updated page "${updatedPage.title}" (ID: ${updatedPage.id})\nView at: ${authManager.getBaseUrl()}${updatedPage._links.webui}`
              }]
            };
          } catch (error) {
            throw new ToolError(`Failed to update existing page ${existingPageId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          // Create new page
          if (!spaceKey) {
            throw new ToolError("spaceKey is required when creating a new page");
          }
          
          // Extract title from markdown
          let title = (metadata as FileMetadata)?.title;
          if (!title) {
            const titleMatch = markdownContent.match(/^#+\s+(.+)$/m);
            title = titleMatch?.[1] || 'Untitled';
          }
          
          const newPageData: any = {
            type: 'page',
            title,
            space: { key: spaceKey },
            body: {
              atlas_doc_format: {
                value: JSON.stringify(adf),
                representation: 'atlas_doc_format'
              }
            }
          };
          
          if (parentPageId) {
            newPageData.ancestors = [{ id: parentPageId }];
          }
          
          try {
            const newPage = await client.createContent(newPageData);
            
            // Update file with page ID prefix if not already present
            if (!pageIdFromFilename) {
              const newManagedFile = await FileManager.createManagedFile(newPage.id, title);
              await fs.move(filePath, newManagedFile.filePath);
              
              // Create metadata file
              const newMetadata: FileMetadata = {
                pageId: newPage.id,
                title: newPage.title,
                spaceKey: newPage.space.key,
                originalADF: JSON.stringify(adf)
              };
              await fs.outputFile(newManagedFile.metadataPath, JSON.stringify(newMetadata, null, 2), 'utf-8');
              
              const displayPath = FileManager.getDisplayPath(newManagedFile.filePath);
              
              return {
                content: [{
                  type: "text",
                  text: `Successfully created new page "${newPage.title}" (ID: ${newPage.id})\nFile renamed to: ${displayPath}\nView at: ${authManager.getBaseUrl()}${newPage._links.webui}`
                }]
              };
            } else {
              return {
                content: [{
                  type: "text",
                  text: `Successfully created new page "${newPage.title}" (ID: ${newPage.id})\nView at: ${authManager.getBaseUrl()}${newPage._links.webui}`
                }]
              };
            }
          } catch (error) {
            throw new ToolError(`Failed to create new page: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ToolError(`Invalid parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        
        if (error instanceof ToolError) {
          throw error;
        }
        
        throw new ToolError(`Failed to upload page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}