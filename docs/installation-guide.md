# Installation Guide

Complete installation instructions for the MCP Confluence ADF server.

## Prerequisites

- **Node.js**: Version 20.18.1 or higher
- **Yarn**: Version 1.22.0 or higher (recommended) or npm
- **Claude Code**: Latest version with MCP support
- **Atlassian Account**: Active Confluence access

## Installation Methods

### Method 1: npm/yarn Installation (Recommended)

```bash
# Using yarn (recommended)
yarn add mcp-confluence-adf

# Using npm
npm install mcp-confluence-adf
```

### Method 2: From Source

```bash
# Clone the repository
git clone https://github.com/JeromeErasmus/mcp-confluence-adf.git
cd mcp-confluence-adf

# Install dependencies
yarn install

# Build the project
yarn build
```

## MCP Configuration

Add the server to your Claude Code MCP configuration:

### Linux/macOS Configuration

Edit `~/.config/claude/mcp_servers.json`:

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

### Windows Configuration

Edit `%APPDATA%\claude\mcp_servers.json` with the same structure.

## Environment Setup

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CONFLUENCE_BASE_URL` | Your Confluence domain | `https://company.atlassian.net` |
| `CONFLUENCE_EMAIL` | Your Atlassian account email | `user@company.com` |

### Authentication Setup

The server will prompt for your Atlassian API token on first use. The token is securely stored using the system keychain.

**Creating an Atlassian API Token:**

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a descriptive name (e.g., "Claude Code MCP")
4. Copy the generated token
5. Paste it when prompted by the MCP server

## Verification

Test your installation by restarting Claude Code and running:

```
List available Confluence spaces
```

If configured correctly, you should see your Confluence spaces listed.

**Need more help?**
- **[Installation Verification](./installation-verification.md)** - Test that everything is working
- **[Installation Troubleshooting](./installation-troubleshooting.md)** - Common issues and solutions
- **[Advanced Installation](./installation-advanced.md)** - Custom configurations