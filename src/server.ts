#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import tool handlers
import { createAuthTool } from "./tools/auth.js";
import { createOAuthTools } from "./tools/oauth.js";
import { createDownloadPageTool } from "./tools/download-page.js";
import { createUploadPageTool } from "./tools/upload-page.js";
import { createCrudTools } from "./tools/crud.js";
import { createSearchTools } from "./tools/search.js";

// Create MCP server
const server = new McpServer({
  name: "mcp-confluence-adf",
  version: "0.2.0"
});

// Register authentication tool (API Token)
const authTool = createAuthTool();
server.registerTool(
  authTool.name,
  {
    title: authTool.title,
    description: authTool.description,
    inputSchema: authTool.inputSchema
  },
  authTool.handler
);

// Register OAuth tools
const oauthTools = createOAuthTools();
for (const tool of oauthTools) {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema
    },
    tool.handler
  );
}

// Register download page tool
const downloadTool = createDownloadPageTool();
server.registerTool(
  downloadTool.name,
  {
    title: downloadTool.title,
    description: downloadTool.description,
    inputSchema: downloadTool.inputSchema
  },
  downloadTool.handler
);

// Register upload page tool
const uploadTool = createUploadPageTool();
server.registerTool(
  uploadTool.name,
  {
    title: uploadTool.title,
    description: uploadTool.description,
    inputSchema: uploadTool.inputSchema
  },
  uploadTool.handler
);

// Register CRUD tools
const crudTools = createCrudTools();
for (const tool of crudTools) {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema
    },
    tool.handler
  );
}

// Register search tools
const searchTools = createSearchTools();
for (const tool of searchTools) {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema
    },
    tool.handler
  );
}

// Start server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    // Log startup (only visible when not connected to Claude Code)
    console.error("MCP Confluence ADF Server running on stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error("Shutting down MCP Confluence ADF Server...");
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error("Shutting down MCP Confluence ADF Server...");
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});