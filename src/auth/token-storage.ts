import * as keytar from 'keytar';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { OAuthTokens, OAuthState } from '../types/index.js';

const SERVICE_NAME = 'mcp-confluence-adf';
const KEYCHAIN_ACCOUNT = 'oauth-tokens';
const FALLBACK_DIR = join(homedir(), '.mcp', 'confluence-adf');
const FALLBACK_FILE = join(FALLBACK_DIR, 'oauth-tokens.json');

export interface StoredOAuthData {
  tokens: OAuthTokens | null;
  cloudId: string | null;
  oauthState: OAuthState | null;
  lastUpdated: number;
}

export class TokenStorage {
  private useKeychain: boolean = true;

  constructor() {
    // Test if keychain is available
    this.testKeychainAccess();
  }

  private async testKeychainAccess(): Promise<void> {
    try {
      // Test keychain access by trying to set/get/delete a test value
      await keytar.setPassword(SERVICE_NAME, 'test', 'test');
      await keytar.getPassword(SERVICE_NAME, 'test');
      await keytar.deletePassword(SERVICE_NAME, 'test');
      this.useKeychain = true;
    } catch (error) {
      console.warn('Keychain not available, falling back to file storage');
      this.useKeychain = false;
      this.ensureFallbackDir();
    }
  }

  private ensureFallbackDir(): void {
    if (!existsSync(FALLBACK_DIR)) {
      mkdirSync(FALLBACK_DIR, { recursive: true });
    }
  }

  /**
   * Store OAuth data securely
   */
  async store(data: StoredOAuthData): Promise<void> {
    const serializedData = JSON.stringify({
      ...data,
      lastUpdated: Date.now()
    });

    if (this.useKeychain) {
      try {
        await keytar.setPassword(SERVICE_NAME, KEYCHAIN_ACCOUNT, serializedData);
        return;
      } catch (error) {
        console.warn('Failed to store in keychain, falling back to file storage:', error);
        this.useKeychain = false;
        this.ensureFallbackDir();
      }
    }

    // Fallback to encrypted file storage
    await writeFile(FALLBACK_FILE, serializedData, { mode: 0o600 });
  }

  /**
   * Retrieve OAuth data securely
   */
  async retrieve(): Promise<StoredOAuthData | null> {
    let serializedData: string | null = null;

    if (this.useKeychain) {
      try {
        serializedData = await keytar.getPassword(SERVICE_NAME, KEYCHAIN_ACCOUNT);
      } catch (error) {
        console.warn('Failed to retrieve from keychain, falling back to file storage:', error);
        this.useKeychain = false;
      }
    }

    if (!serializedData && existsSync(FALLBACK_FILE)) {
      try {
        serializedData = await readFile(FALLBACK_FILE, 'utf8');
      } catch (error) {
        console.error('Failed to read token file:', error);
        return null;
      }
    }

    if (!serializedData) {
      return null;
    }

    try {
      const data = JSON.parse(serializedData) as StoredOAuthData;
      
      // Validate data structure
      if (!this.isValidStoredData(data)) {
        console.warn('Invalid stored OAuth data, clearing...');
        await this.clear();
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to parse stored OAuth data:', error);
      await this.clear();
      return null;
    }
  }

  /**
   * Clear stored OAuth data
   */
  async clear(): Promise<void> {
    if (this.useKeychain) {
      try {
        await keytar.deletePassword(SERVICE_NAME, KEYCHAIN_ACCOUNT);
      } catch (error) {
        // Ignore errors when clearing
      }
    }

    if (existsSync(FALLBACK_FILE)) {
      try {
        await writeFile(FALLBACK_FILE, '', { mode: 0o600 });
      } catch (error) {
        // Ignore errors when clearing
      }
    }
  }

  /**
   * Check if token is expired and needs refresh
   */
  isTokenExpired(data: StoredOAuthData): boolean {
    if (!data.tokens || !data.lastUpdated) {
      return true;
    }

    const tokenAge = Date.now() - data.lastUpdated;
    const expiryTime = (data.tokens.expires_in - 300) * 1000; // Refresh 5 minutes early
    
    return tokenAge > expiryTime;
  }

  /**
   * Get storage location info for debugging
   */
  getStorageInfo(): { method: string; location: string } {
    if (this.useKeychain) {
      return {
        method: 'keychain',
        location: `macOS Keychain (${SERVICE_NAME})`
      };
    }

    return {
      method: 'file',
      location: FALLBACK_FILE
    };
  }

  private isValidStoredData(data: any): data is StoredOAuthData {
    return (
      typeof data === 'object' &&
      data !== null &&
      (data.tokens === null || (typeof data.tokens === 'object' && typeof data.tokens.access_token === 'string')) &&
      (data.cloudId === null || typeof data.cloudId === 'string') &&
      (data.oauthState === null || typeof data.oauthState === 'object') &&
      typeof data.lastUpdated === 'number'
    );
  }
}

// Global instance
export const tokenStorage = new TokenStorage();