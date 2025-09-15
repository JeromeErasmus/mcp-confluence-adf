import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { OAuthClient } from "../auth/oauth-client.js";
import { OAuthConfluenceClient } from "../client/oauth-confluence.js";
import { tokenStorage } from "../auth/token-storage.js";
import { ToolHandler, ToolError, OAuthCredentials } from "../types/index.js";

const execAsync = promisify(exec);

// Global OAuth client instance
let globalOAuthClient: OAuthClient | null = null;
let globalOAuthConfluenceClient: OAuthConfluenceClient | null = null;

/**
 * Initialize OAuth authentication flow
 */
export function createOAuthInitTool(): ToolHandler {
  return {
    name: "confluence_oauth_init",
    title: "Initialize OAuth Authentication",
    description: "Initialize OAuth 2.0 authentication flow for Confluence. Requires client credentials from Atlassian Developer Console.",
    inputSchema: {
      clientId: z.string().min(1).describe("OAuth Client ID from Atlassian Developer Console"),
      clientSecret: z.string().min(1).describe("OAuth Client Secret from Atlassian Developer Console"),
      redirectUri: z.string().url().optional().describe("OAuth redirect URI (defaults to http://localhost:PORT/oauth/callback)")
    },
    handler: async ({ clientId, clientSecret, redirectUri }) => {
      try {
        // Start callback server to get available port
        const oauthClient = new OAuthClient({
          clientId,
          clientSecret,
          redirectUri: redirectUri || 'http://localhost:0/oauth/callback' // Will be updated with actual port
        });

        const port = await oauthClient.startCallbackServer();
        
        // Update redirect URI with actual port if not provided
        const actualRedirectUri = redirectUri || `http://localhost:${port}/oauth/callback`;
        
        // Create new client with correct redirect URI
        globalOAuthClient = new OAuthClient({
          clientId,
          clientSecret,
          redirectUri: actualRedirectUri
        });

        // Start callback server on the same port
        await globalOAuthClient.startCallbackServer();
        
        // Generate authorization URL
        const authUrl = globalOAuthClient.generateAuthUrl();

        return {
          content: [{
            type: "text",
            text: `OAuth initialization successful! 

🌐 **Authorization URL:** 
${authUrl}

📝 **Next steps:**
1. Click the URL above or copy it to your browser
2. Sign in to your Atlassian account
3. Grant permission to the application
4. The browser will redirect to the callback URL
5. Use the 'confluence_oauth_complete' tool to finish the process

⏰ **Timeout:** 5 minutes

🔧 **Callback server:** Running on http://localhost:${port}/oauth/callback`
          }]
        };
      } catch (error) {
        throw new ToolError(`Failed to initialize OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

/**
 * Complete OAuth authentication flow
 */
export function createOAuthCompleteTool(): ToolHandler {
  return {
    name: "confluence_oauth_complete",
    title: "Complete OAuth Authentication",
    description: "Complete the OAuth 2.0 authentication flow. Call this after visiting the authorization URL.",
    inputSchema: {
      openBrowser: z.boolean().optional().describe("Automatically open the authorization URL in browser (default: true)")
    },
    handler: async ({ openBrowser = true }) => {
      try {
        if (!globalOAuthClient) {
          throw new ToolError("OAuth not initialized. Please run 'confluence_oauth_init' first.");
        }

        // Optionally open browser
        if (openBrowser) {
          const authUrl = globalOAuthClient.generateAuthUrl();
          try {
            // Try to open in default browser
            const platform = process.platform;
            const command = platform === 'darwin' ? 'open' : 
                          platform === 'win32' ? 'start' : 'xdg-open';
            await execAsync(`${command} "${authUrl}"`);
          } catch (error) {
            console.warn('Could not auto-open browser:', error);
          }
        }

        // Wait for OAuth completion
        const result = await globalOAuthClient.waitForAuthCompletion();

        if (!result.success) {
          throw new ToolError(`OAuth authentication failed: ${result.error}`);
        }

        // Create OAuth Confluence client
        globalOAuthConfluenceClient = new OAuthConfluenceClient(globalOAuthClient);

        // Test the connection
        const testResult = await globalOAuthConfluenceClient.testConnection();
        if (!testResult.success) {
          throw new ToolError(`Connection test failed: ${testResult.error}`);
        }

        // Stop callback server
        globalOAuthClient.stopCallbackServer();

        return {
          content: [{
            type: "text",
            text: `✅ **OAuth Authentication Successful!**

🔐 **Status:** Authenticated with Confluence Cloud
🌐 **Cloud ID:** ${globalOAuthConfluenceClient.getOAuthClient().getCloudId()}
🔧 **Scopes:** Confluence read/write permissions granted
⚡ **Ready:** You can now use all Confluence tools

The OAuth tokens are securely stored in memory and will be automatically refreshed as needed.`
          }]
        };
      } catch (error) {
        // Clean up on error
        if (globalOAuthClient) {
          globalOAuthClient.stopCallbackServer();
        }
        
        if (error instanceof ToolError) {
          throw error;
        }
        
        throw new ToolError(`Failed to complete OAuth authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

/**
 * Get OAuth status
 */
export function createOAuthStatusTool(): ToolHandler {
  return {
    name: "confluence_oauth_status",
    title: "Check OAuth Status",
    description: "Check the current OAuth authentication status and token information.",
    inputSchema: {},
    handler: async () => {
      try {
        if (!globalOAuthClient) {
          return {
            content: [{
              type: "text",
              text: "❌ **OAuth Not Initialized**\n\nPlease run 'confluence_oauth_init' to start the authentication process."
            }]
          };
        }

        if (!globalOAuthClient.isAuthenticated()) {
          return {
            content: [{
              type: "text",
              text: "⏳ **OAuth Initialized but Not Authenticated**\n\nPlease complete the OAuth flow by visiting the authorization URL and running 'confluence_oauth_complete'."
            }]
          };
        }

        // Test connection
        const testResult = await globalOAuthConfluenceClient?.testConnection();
        
        const cloudId = globalOAuthConfluenceClient?.getOAuthClient().getCloudId() || 'Unknown';
        const storageInfo = tokenStorage.getStorageInfo();
        
        return {
          content: [{
            type: "text",
            text: `✅ **OAuth Authentication Active**

🔐 **Status:** ${testResult?.success ? 'Connected' : 'Connection Issue'}
🌐 **Cloud ID:** ${cloudId}
🔧 **Client Configured:** Yes
⚡ **Ready for API calls:** ${testResult?.success ? 'Yes' : 'No'}
💾 **Token Storage:** ${storageInfo.method} (${storageInfo.location})

${testResult?.success ? '' : `⚠️ **Connection Issue:** ${testResult?.error}`}`
          }]
        };
      } catch (error) {
        throw new ToolError(`Failed to check OAuth status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

/**
 * Clear OAuth authentication
 */
export function createOAuthClearTool(): ToolHandler {
  return {
    name: "confluence_oauth_clear",
    title: "Clear OAuth Authentication",
    description: "Clear the current OAuth authentication and tokens.",
    inputSchema: {},
    handler: async () => {
      try {
        if (globalOAuthClient) {
          await globalOAuthClient.clear();
          globalOAuthClient = null;
        }
        
        globalOAuthConfluenceClient = null;

        return {
          content: [{
            type: "text",
            text: "✅ **OAuth Authentication Cleared**\n\nAll tokens and authentication state have been cleared. Run 'confluence_oauth_init' to start a new authentication flow."
          }]
        };
      } catch (error) {
        throw new ToolError(`Failed to clear OAuth authentication: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
}

/**
 * Export OAuth tools
 */
export function createOAuthTools(): ToolHandler[] {
  return [
    createOAuthInitTool(),
    createOAuthCompleteTool(),
    createOAuthStatusTool(),
    createOAuthClearTool()
  ];
}

/**
 * Get global OAuth Confluence client
 */
export function getOAuthConfluenceClient(): OAuthConfluenceClient | null {
  return globalOAuthConfluenceClient;
}

/**
 * Check if OAuth is authenticated
 */
export function isOAuthAuthenticated(): boolean {
  return globalOAuthClient?.isAuthenticated() || false;
}