import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import { OAuthCredentials, OAuthTokens, OAuthState, AtlassianResource } from '../types/index.js';
import { tokenStorage } from './token-storage.js';

export class OAuthClient {
  private credentials: OAuthCredentials;
  private tokens: OAuthTokens | null = null;
  private cloudId: string | null = null;
  private domainUrl: string | null = null;
  private oauthState: OAuthState | null = null;
  private callbackServer: Server | null = null;
  private authCompletionResolver: ((value: { success: boolean; error?: string }) => void) | null = null;
  private isLoaded: boolean = false;

  constructor(credentials: OAuthCredentials) {
    this.credentials = credentials;
    // Load tokens on initialization
    this.loadTokens();
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    return { codeVerifier, codeChallenge };
  }

  /**
   * Generate secure random state
   */
  private generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  generateAuthUrl(): string {
    const { codeVerifier, codeChallenge } = this.generatePKCE();
    const state = this.generateState();

    this.oauthState = {
      state,
      codeVerifier,
      codeChallenge,
      timestamp: Date.now()
    };

    const scopes = [
      'read:confluence-content.all',
      'write:confluence-content',
      'read:content:confluence',
      'write:content:confluence',
      'read:space:confluence',
      'read:page:confluence',
      'write:page:confluence',
      'read:confluence-content.summary',
      'read:confluence-space.summary',
      'search:confluence',
      'offline_access'
    ].join(' ');

    const params = new URLSearchParams({
      audience: 'api.atlassian.com',
      client_id: this.credentials.clientId,
      scope: scopes,
      redirect_uri: this.credentials.redirectUri,
      state,
      response_type: 'code',
      prompt: 'consent',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return `https://auth.atlassian.com/authorize?${params.toString()}`;
  }

  /**
   * Start callback server to handle OAuth redirect
   */
  async startCallbackServer(): Promise<number> {
    return new Promise((resolve, reject) => {
      const app = express();
      app.use(cors());
      app.use(express.json());

      app.get('/oauth/callback', async (req, res) => {
        try {
          const { code, state, error } = req.query;

          if (error) {
            res.status(400).send(`OAuth error: ${error}`);
            if (this.authCompletionResolver) {
              this.authCompletionResolver({ success: false, error: error as string });
            }
            return;
          }

          if (!code || !state) {
            res.status(400).send('Missing authorization code or state');
            if (this.authCompletionResolver) {
              this.authCompletionResolver({ success: false, error: 'Missing authorization code or state' });
            }
            return;
          }

          // Validate state
          if (!this.oauthState || state !== this.oauthState.state) {
            res.status(400).send('Invalid state parameter');
            if (this.authCompletionResolver) {
              this.authCompletionResolver({ success: false, error: 'Invalid state parameter' });
            }
            return;
          }

          // Exchange code for tokens
          await this.exchangeCodeForTokens(code as string);
          
          // Get cloud ID
          await this.fetchCloudId();

          res.send(`
            <html>
              <body>
                <h1>✅ Authentication Successful!</h1>
                <p>You can close this window and return to your terminal.</p>
                <script>window.close();</script>
              </body>
            </html>
          `);

          if (this.authCompletionResolver) {
            this.authCompletionResolver({ success: true });
          }

        } catch (error) {
          console.error('OAuth callback error:', error);
          res.status(500).send('Internal server error during OAuth callback');
          if (this.authCompletionResolver) {
            this.authCompletionResolver({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          }
        }
      });

      // Extract port from redirect URI
      const redirectUrl = new URL(this.credentials.redirectUri);
      const port = redirectUrl.port ? parseInt(redirectUrl.port) : (redirectUrl.protocol === 'https:' ? 443 : 80);
      
      this.callbackServer = app.listen(port, 'localhost', () => {
        const address = this.callbackServer!.address();
        if (address && typeof address === 'object') {
          resolve(address.port);
        } else {
          reject(new Error('Failed to start callback server'));
        }
      });

      this.callbackServer.on('error', reject);
    });
  }

  /**
   * Stop callback server
   */
  stopCallbackServer(): void {
    if (this.callbackServer) {
      this.callbackServer.close();
      this.callbackServer = null;
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<void> {
    if (!this.oauthState) {
      throw new Error('OAuth state not found');
    }

    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        code,
        redirect_uri: this.credentials.redirectUri,
        code_verifier: this.oauthState.codeVerifier
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${error}`);
    }

    this.tokens = await response.json();
    await this.saveTokens();
  }

  /**
   * Get accessible Atlassian resources and extract cloud ID and domain URL
   */
  private async fetchCloudId(): Promise<void> {
    if (!this.tokens) {
      throw new Error('No OAuth tokens available');
    }

    const response = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { 'Authorization': `Bearer ${this.tokens.access_token}` }
    });

    if (!response.ok) {
      throw new Error(`Failed to get accessible resources: ${response.status}`);
    }

    const resources: AtlassianResource[] = await response.json();
    
    // Find the first resource with Confluence scopes
    const confluenceResource = resources.find(resource => 
      resource.scopes.some(scope => scope.includes('confluence'))
    );

    if (!confluenceResource) {
      throw new Error('No Confluence resources found');
    }

    this.cloudId = confluenceResource.id;
    this.domainUrl = confluenceResource.url;
    await this.saveTokens();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.tokens || !this.tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        refresh_token: this.tokens.refresh_token
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${error}`);
    }

    this.tokens = await response.json();
    await this.saveTokens();
  }

  /**
   * Ensure we have a valid access token
   */
  async ensureValidToken(): Promise<void> {
    // Ensure tokens are loaded first
    await this.loadTokens();
    
    if (!this.tokens) {
      throw new Error('No OAuth tokens available');
    }

    // Simple expiry check (tokens typically expire in 3600 seconds)
    // In production, you'd want more sophisticated token management
    const tokenAge = Date.now() - (this.oauthState?.timestamp || 0);
    const tokenExpired = tokenAge > (this.tokens.expires_in - 300) * 1000; // Refresh 5 minutes early

    if (tokenExpired && this.tokens.refresh_token) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Get OAuth authorization headers
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.tokens) {
      throw new Error('No OAuth tokens available');
    }

    return {
      'Authorization': `Bearer ${this.tokens.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Get cloud ID for API calls
   */
  getCloudId(): string {
    if (!this.cloudId) {
      throw new Error('No cloud ID available');
    }
    return this.cloudId;
  }

  /**
   * Get domain URL for web links
   */
  getDomainUrl(): string {
    if (!this.domainUrl) {
      throw new Error('No domain URL available');
    }
    return this.domainUrl;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    // Try to load tokens if not already loaded (synchronous check for existing state)
    if (!this.isLoaded) {
      this.loadTokens().catch(() => {}); // Fire and forget
      return false;
    }
    return !!(this.tokens && this.cloudId && this.domainUrl);
  }

  /**
   * Wait for OAuth flow completion
   */
  waitForAuthCompletion(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      this.authCompletionResolver = resolve;
      
      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.authCompletionResolver === resolve) {
          this.authCompletionResolver = null;
          resolve({ success: false, error: 'Authentication timeout' });
        }
      }, 300000);
    });
  }

  /**
   * Clear authentication state
   */
  async clear(): Promise<void> {
    this.tokens = null;
    this.cloudId = null;
    this.domainUrl = null;
    this.oauthState = null;
    this.stopCallbackServer();
    this.authCompletionResolver = null;
    
    // Clear persistent storage
    await tokenStorage.clear();
  }

  /**
   * Load tokens from persistent storage
   */
  private async loadTokens(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      const storedData = await tokenStorage.retrieve();
      if (storedData) {
        // Check if token needs refresh
        if (tokenStorage.isTokenExpired(storedData)) {
          if (storedData.tokens?.refresh_token) {
            this.tokens = storedData.tokens;
            this.cloudId = storedData.cloudId;
            this.domainUrl = storedData.domainUrl;
            await this.refreshAccessToken();
          } else {
            // Token expired and no refresh token, clear storage
            await tokenStorage.clear();
          }
        } else {
          // Token is still valid
          this.tokens = storedData.tokens;
          this.cloudId = storedData.cloudId;
          this.domainUrl = storedData.domainUrl;
          this.oauthState = storedData.oauthState;
        }
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
    } finally {
      this.isLoaded = true;
    }
  }

  /**
   * Save tokens to persistent storage
   */
  private async saveTokens(): Promise<void> {
    try {
      await tokenStorage.store({
        tokens: this.tokens,
        cloudId: this.cloudId,
        domainUrl: this.domainUrl,
        oauthState: this.oauthState,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  /**
   * Serialize state for persistence (legacy support)
   */
  serialize(): string {
    return JSON.stringify({
      tokens: this.tokens,
      cloudId: this.cloudId,
      domainUrl: this.domainUrl,
      oauthState: this.oauthState
    });
  }

  /**
   * Deserialize state from persistence (legacy support)
   */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.tokens = parsed.tokens;
      this.cloudId = parsed.cloudId;
      this.domainUrl = parsed.domainUrl;
      this.oauthState = parsed.oauthState;
      this.isLoaded = true; // Mark as loaded for testing
    } catch (error) {
      console.error('Failed to deserialize OAuth state:', error);
    }
  }
}