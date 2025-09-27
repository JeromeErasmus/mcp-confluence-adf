# Quick Start Guide

Get up and running with MCP Confluence ADF in minutes.

## Installation

### Quick Installation

```bash
yarn add mcp-confluence-adf
# or
npm install mcp-confluence-adf
```

**Need more help?** For detailed installation instructions, see:
- **[Installation Guide](./installation-guide.md)** - Complete installation instructions and prerequisites
- **[Installation Verification](./installation-verification.md)** - Test that everything is working correctly
- **[Advanced Installation](./installation-advanced.md)** - Custom configurations and environment-specific setup
- **[Installation Troubleshooting](./installation-troubleshooting.md)** - Common issues and solutions

## Basic Usage

### 1. Configure MCP Server

Add to your Claude Code MCP configuration:

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

### 2. Basic Operations

#### List Confluence Spaces
```
List all my Confluence spaces
```

#### Read a Confluence Page
```
Get the content of page ID 123456789 from Confluence
```

#### Create a New Page
```
Create a new page called "My Documentation" in space DOCS with content:

# Welcome
This is my new documentation page.
```

#### Update Existing Content
```
Update page ID 987654321 with new content:

# Updated Documentation
This page has been updated with new information.
```

### 3. Template System

#### List Available Templates
```
Show me all available templates
```

#### Generate from Template
```
Generate documentation using the "technical-specification" template
```

## Common Workflows

### Creating Documentation from Templates

1. **List templates**: See what's available
2. **Generate template**: Create structured content
3. **Create page**: Publish to Confluence
4. **Validate**: Check the results

### Content Migration

1. **Export existing content**: Convert to markdown
2. **Process with templates**: Structure the content
3. **Convert to ADF**: Prepare for Confluence
4. **Import**: Create pages in Confluence

### Batch Operations

1. **Identify content**: Use search to find pages
2. **Process multiple files**: Apply templates or transformations
3. **Bulk update**: Update multiple pages at once

## Next Steps

- **[MCP Server Configuration](./mcp-server-configuration.md)** - Detailed server setup
- **[Confluence Content Tools](./confluence-content-tools.md)** - All available tools
- **[Template System](./template-system.md)** - Working with templates
- **[Claude Code Integration](./claude-code-integration.md)** - Advanced Claude Code workflows