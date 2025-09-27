# Authentication Setup

Complete guide to setting up secure authentication with Confluence Cloud using OAuth 2.0.

## Overview

The MCP Confluence ADF server uses OAuth 2.0 for secure, token-based authentication with Confluence Cloud. This provides:

- **Secure Access**: No need to store passwords or API keys
- **Scoped Permissions**: Access only what your app needs
- **Automatic Refresh**: Tokens refresh automatically
- **Revocable Access**: Can be revoked from Atlassian account settings

## Prerequisites

- **Confluence Cloud** instance (not Server/Data Center)
- **Atlassian Account** with admin access to your Confluence
- **Developer Console Access** to create OAuth apps

## Step 1: Create OAuth App in Atlassian Developer Console

### Access Developer Console

1. Go to **[developer.atlassian.com](https://developer.atlassian.com)**
2. Sign in with your Atlassian account
3. Click your **profile icon** → **"Developer console"**

### Create New App

1. Click **"Create app"**
2. Enter app name: `"Claude Code MCP Server"` (or your preferred name)
3. Click **"Create"**

### Configure OAuth 2.0

1. In your app, click **"Authorization"** in left menu
2. Next to **"OAuth 2.0 (3LO)"**, click **"Configure"**
3. Enter **Callback URL**: `http://localhost:9000/oauth/callback`
4. Click **"Save changes"**

### Add Required Permissions

1. Click **"Permissions"** in left menu
2. Next to **"Confluence API"**, click **"Add"**
3. Select these **required scopes**:

#### Essential Scopes
```
read:confluence-content.all    - Read all content
write:confluence-content       - Create/edit content  
read:content:confluence        - Read content (granular)
write:content:confluence       - Write content (granular)
read:space:confluence          - Access spaces
read:page:confluence           - Read pages
write:page:confluence          - Create/edit pages
search:confluence              - Search functionality
offline_access                 - Token refresh
```

#### Additional Scopes (Recommended)
```
read:confluence-content.summary     - Content summaries
read:confluence-space.summary       - Space information
```

4. Click **"Save"** after adding all scopes

### Get Your Credentials

1. Click **"Settings"** in left menu
2. Copy your **Client ID** and **Client Secret**
3. **Keep these secure** - you'll need them for authentication

## Step 2: Initialize OAuth in Claude Code

### Start Authentication Flow

In Claude Code, run:

```
Set up OAuth authentication with Confluence using:
- Client ID: [your-client-id]
- Client Secret: [your-client-secret]
```

Or use the tool directly:
```json
{
  "tool": "confluence_oauth_init",
  "parameters": {
    "clientId": "your-client-id-from-console",
    "clientSecret": "your-client-secret-from-console"
  }
}
```

**Expected Response:**
```
OAuth initialization started

📱 Next step: Visit this URL to authorize the application:
https://auth.atlassian.com/authorize?...

 This URL will expire in 10 minutes
```

### Complete Authorization

Continue with:
```
Complete OAuth authentication and open my browser
```

Or:
```json
{
  "tool": "confluence_oauth_complete", 
  "parameters": {
    "openBrowser": true
  }
}
```

## Step 3: Browser Authorization Flow

### Authorization Process

1. **Browser Opens** to Atlassian authorization page
2. **Sign In** to your Atlassian account (if not already signed in)
3. **Review App Permissions**:
   - App name and description
   - Requested scopes/permissions
   - Which Confluence sites it can access
4. **Click "Accept"** to grant permissions
5. **Automatic Redirect** back to callback server
6. **Success Page** displays "Authentication Successful!"
7. **Browser tab closes** automatically

### What Happens During Authorization

- **PKCE Security**: Uses Proof Key for Code Exchange for enhanced security
- **State Parameter**: Prevents CSRF attacks
- **Secure Token Exchange**: Authorization code exchanged for access tokens
- **Local Storage**: Tokens stored securely on your machine

## Step 4: Verify Authentication

### Check Status

```
Check my Confluence authentication status
```

**Expected Output:**
```
OAuth Authentication Active

Status: Connected and ready
Cloud ID: [your-confluence-cloud-id]  
Client Configured: Yes
Ready for API calls: Yes
🔄 Token Refresh: Automatic
Storage: Secure keychain (macOS) / Credential Manager (Windows) / File (Linux)
```

### Test Connection

```
List my Confluence spaces
```

If authentication is working, you'll see your accessible Confluence spaces.

## Token Management

### Automatic Token Refresh

- **Access tokens** expire after 1 hour
- **Refresh tokens** are used automatically to get new access tokens
- **No user intervention** required for token refresh
- **Refresh tokens** expire after 90 days of inactivity

### Token Storage Security

**macOS**: Keychain Access
- Stored in system keychain
- Encrypted and secure
- Access controlled by macOS

**Windows**: Credential Manager  
- Windows Credential Manager
- Encrypted storage
- User-specific access

**Linux**: File-based with permissions
- Stored in `~/.mcp/confluence-adf/oauth-tokens.json`
- File permissions: 600 (owner read/write only)
- JSON format with encrypted sensitive data

### Managing Tokens

#### Check Token Status
```
Check Confluence authentication status
```

#### Clear/Reset Authentication
```
Clear my Confluence authentication
```

This will:
- Remove all stored tokens
- Clear OAuth state
- Require re-authentication for next use

## Troubleshooting Authentication

### Common Issues

#### 1. "Invalid Client" Error
**Cause**: Client ID or secret incorrect
**Solution**: Verify credentials from Developer Console

#### 2. "Redirect URI Mismatch" 
**Cause**: Callback URL doesn't match app configuration
**Solution**: Ensure callback URL in app matches `http://localhost:9000/oauth/callback`

#### 3. "Insufficient Scope" Error
**Cause**: Missing required OAuth scopes
**Solution**: Add all required scopes in Developer Console

#### 4. "Site Access Denied"
**Cause**: App doesn't have access to your Confluence site
**Solution**: 
- Check site admin settings
- Ensure your account has appropriate permissions

#### 5. Browser Doesn't Open
**Cause**: System browser configuration
**Solution**: 
- Copy authorization URL manually
- Paste in browser to complete flow

#### 6. Tokens Expired
**Cause**: Refresh token expired (90 days inactive)
**Solution**: Re-run authentication flow

### Debugging Steps

1. **Check MCP Server Logs**:
   ```bash
   # View server output for error messages
   tail -f ~/.mcp/confluence-adf/logs/server.log
   ```

2. **Verify App Configuration**:
   - Client ID and secret correct
   - All required scopes added
   - Callback URL exact match

3. **Test Network Connectivity**:
   ```bash
   curl -I https://api.atlassian.com
   ```

4. **Clear and Retry**:
   ```
   Clear Confluence authentication
   Set up OAuth authentication again
   ```

## Security Best Practices

### App Configuration
- **Use descriptive app names** that identify their purpose
- **Request minimal scopes** needed for functionality
- **Regular review** of app permissions in Atlassian account

### Token Handling
- **Never share** client secrets or tokens
- **Rotate credentials** periodically (create new app if needed)
- **Monitor access** in Atlassian account security settings
- **Revoke unused apps** from account settings

### Development vs Production
- **Separate apps** for development and production use
- **Different callback URLs** for different environments
- **Environment-specific credentials**

## Advanced Configuration

### Custom Callback Port

If port 9000 is unavailable:

```json
{
  "tool": "confluence_oauth_init",
  "parameters": {
    "clientId": "your-client-id", 
    "clientSecret": "your-client-secret",
    "redirectUri": "http://localhost:8080/oauth/callback"
  }
}
```

Update your app's callback URL to match.

### Multiple Confluence Instances

For multiple Confluence clouds:

1. Create separate OAuth apps for each instance
2. Use different client credentials for each
3. Authenticate separately for each instance

### Headless Authentication

For server environments without browsers:

1. Generate authorization URL on development machine
2. Complete authorization flow manually
3. Export/import tokens to server environment

## API Rate Limits

Confluence Cloud API has rate limits:

- **Standard**: 10 requests per second per app
- **Burst**: Up to 100 requests in short periods  
- **Daily**: 10,000 requests per day per app

The MCP server handles rate limiting automatically:
- Request queuing and throttling
- Exponential backoff on rate limit errors
- Automatic retry with appropriate delays

## Next Steps

Once authentication is complete:

- **[Quick Start Guide](./quick-start.md)** - Start using Confluence tools
- **[Confluence Content Tools](./confluence-content-tools.md)** - Available operations
- **[MCP Tool Discovery](./mcp-tool-discovery.md)** - Finding and using tools
- **[Claude Code Integration](./claude-code-integration.md)** - Advanced workflows