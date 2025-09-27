# MCP Server Configuration

Detailed configuration guide for the MCP Confluence ADF server.

## Configuration File Location

### Claude Code Configuration

The MCP server is configured through Claude Code's MCP configuration file:

**Linux/macOS:**
```
~/.config/claude/mcp_servers.json
```

**Windows:**
```
%APPDATA%\claude\mcp_servers.json
```

## Basic Configuration

### Minimum Configuration

```json
{
  "mcpServers": {
    "confluence-adf": {
      "command": "node",
      "args": ["/path/to/mcp-confluence-adf/dist/server.js"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://your-domain.atlassian.net",
        "CONFLUENCE_EMAIL": "your-email@example.com"
      }
    }
  }
}
```

### Complete Configuration

```json
{
  "mcpServers": {
    "confluence-adf": {
      "command": "node",
      "args": ["/path/to/mcp-confluence-adf/dist/server.js"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://your-domain.atlassian.net",
        "CONFLUENCE_EMAIL": "your-email@example.com",
        "LOG_LEVEL": "info",
        "TEMPLATE_PATH": "./templates",
        "CACHE_ENABLED": "true",
        "CACHE_TTL": "300"
      }
    }
  }
}
```

## Environment Variables

### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CONFLUENCE_BASE_URL` | Your Confluence base URL | `https://company.atlassian.net` | |
| `CONFLUENCE_EMAIL` | Your Atlassian account email | `user@company.com` | |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging verbosity | `info` | `debug`, `info`, `warn`, `error` |
| `TEMPLATE_PATH` | Custom template directory | `./templates` | `./my-templates` |
| `CACHE_ENABLED` | Enable response caching | `true` | `true`, `false` |
| `CACHE_TTL` | Cache time-to-live (seconds) | `300` | `600` |
| `MAX_CONTENT_SIZE` | Maximum content size (bytes) | `10485760` | `20971520` |
| `REQUEST_TIMEOUT` | API request timeout (ms) | `30000` | `60000` |

## Authentication Configuration

### API Token Storage

The server uses your system's keychain to securely store the Atlassian API token:

- **macOS**: Keychain Access
- **Windows**: Windows Credential Manager  
- **Linux**: libsecret/gnome-keyring

### Token Management

```bash
# The server will prompt for your token on first use
# Token is automatically stored securely
# To reset/update token, delete it from keychain and restart
```

### Creating an API Token

1. Visit [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Name it descriptively (e.g., "Claude Code MCP Server")
4. Copy the generated token
5. Paste when prompted by the MCP server

## Advanced Configuration

### Custom Template Paths

```json
{
  "env": {
    "TEMPLATE_PATH": "/custom/path/to/templates"
  }
}
```

### Performance Tuning

```json
{
  "env": {
    "CACHE_ENABLED": "true",
    "CACHE_TTL": "600",
    "MAX_CONTENT_SIZE": "20971520",
    "REQUEST_TIMEOUT": "60000"
  }
}
```

### Debug Configuration

```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "DEBUG": "mcp:*"
  }
}
```

## Multiple Confluence Instances

You can configure multiple Confluence servers:

```json
{
  "mcpServers": {
    "confluence-prod": {
      "command": "node",
      "args": ["/path/to/mcp-confluence-adf/dist/server.js"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://prod.atlassian.net",
        "CONFLUENCE_EMAIL": "user@company.com"
      }
    },
    "confluence-staging": {
      "command": "node", 
      "args": ["/path/to/mcp-confluence-adf/dist/server.js"],
      "env": {
        "CONFLUENCE_BASE_URL": "https://staging.atlassian.net",
        "CONFLUENCE_EMAIL": "user@company.com"
      }
    }
  }
}
```

## Troubleshooting Configuration

### Verify Configuration

```bash
# Check if Claude Code can load the configuration
claude-code --check-mcp-config
```

### Common Issues

1. **Path Issues**: Ensure absolute paths to the server script
2. **Permission Issues**: Verify Node.js executable permissions
3. **Environment Variables**: Check all required variables are set
4. **JSON Syntax**: Validate JSON configuration syntax

### Configuration Validation

The server validates configuration on startup and will log any issues:

```
Configuration valid
❌ Missing required environment variable: CONFLUENCE_BASE_URL
❌ Invalid base URL format
 Template path not found, using default
```

## Next Steps

- **[Authentication Setup](./authentication-setup.md)** - Detailed authentication guide
- **[Installation Verification](./installation-verification.md)** - Test your configuration
- **[Troubleshooting](./installation-troubleshooting.md)** - Common configuration problems