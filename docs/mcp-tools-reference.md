# MCP Tools Reference

Complete reference for all MCP tools available in the Confluence ADF server.

## Overview

The MCP Confluence ADF server exposes 20+ tools through the Model Context Protocol, enabling seamless Confluence content management through Claude Code. All tools follow consistent patterns for input validation, error handling, and response formatting.

## Tool Categories

### Authentication Tools
- `confluence_oauth_init` - Initialize OAuth 2.0 authentication
- `confluence_oauth_complete` - Complete OAuth authentication flow
- `confluence_oauth_status` - Check authentication status
- `confluence_oauth_clear` - Clear stored authentication

### Content Management Tools
- `confluence_download_page` - Download pages as Markdown
- `confluence_upload_page` - Upload Markdown to Confluence
- `create_confluence_content` - Create new pages/blog posts
- `read_confluence_content` - Read content in ADF format
- `update_confluence_content` - Update existing content
- `delete_confluence_content` - Delete pages or blog posts

### Search and Discovery Tools
- `search_confluence_pages` - Search using CQL queries
- `list_confluence_spaces` - List accessible spaces
- `get_page_versions` - Get page version history
- `get_page_metadata` - Get page properties and metadata

### Management Tools
- `manage_page_labels` - Add/remove page labels
- `manage_page_permissions` - Handle page-level permissions
- `get_space_permissions` - Check space access rights

### Template Tools
- `list_available_templates` - Discover YAML templates
- `generate_from_template` - Create content from templates
- `validate_template` - Validate template structure
- `create_custom_template` - Helper for template creation

## Authentication Tools

### confluence_oauth_init

Initialize OAuth 2.0 authentication flow with Confluence Cloud.

**Input Schema:**
```json
{
  "clientId": "string (required)",
  "clientSecret": "string (required)", 
  "redirectUri": "string (optional, default: http://localhost:9000/oauth/callback)",
  "scopes": "array (optional, uses default required scopes)"
}
```

**Example Usage:**
```json
{
  "tool": "confluence_oauth_init",
  "parameters": {
    "clientId": "abc123def456",
    "clientSecret": "secret789xyz",
    "redirectUri": "http://localhost:9000/oauth/callback"
  }
}
```

**Response:**
```json
{
  "success": true,
  "authorizationUrl": "https://auth.atlassian.com/authorize?...",
  "expiresIn": 600,
  "instructions": "Visit the authorization URL to grant permissions"
}
```

**Required OAuth Scopes:**
- `read:confluence-content.all`
- `write:confluence-content`
- `read:content:confluence`
- `write:content:confluence`
- `read:space:confluence`
- `read:page:confluence`
- `write:page:confluence`
- `search:confluence`
- `offline_access`

### confluence_oauth_complete

Complete the OAuth authentication after user authorization.

**Input Schema:**
```json
{
  "openBrowser": "boolean (optional, default: true)",
  "timeout": "number (optional, default: 120000ms)"
}
```

**Example Usage:**
```json
{
  "tool": "confluence_oauth_complete",
  "parameters": {
    "openBrowser": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "cloudId": "abc123-def456-ghi789",
  "tokenStorage": "keychain",
  "message": "OAuth authentication completed successfully"
}
```

### confluence_oauth_status

Check current OAuth authentication status.

**Input Schema:** No parameters required

**Example Usage:**
```json
{
  "tool": "confluence_oauth_status"
}
```

**Response:**
```json
{
  "authenticated": true,
  "cloudId": "abc123-def456-ghi789",
  "tokenExpiry": "2024-01-15T11:30:00Z",
  "refreshTokenValid": true,
  "scopes": ["read:confluence-content.all", "write:confluence-content"],
  "storage": "keychain"
}
```

### confluence_oauth_clear

Clear stored OAuth tokens and authentication state.

**Input Schema:** No parameters required

**Example Usage:**
```json
{
  "tool": "confluence_oauth_clear"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OAuth authentication cleared",
  "tokensRemoved": true
}
```

## Content Management Tools

### confluence_download_page

Download a Confluence page as Markdown file for local editing.

**Input Schema:**
```json
{
  "pageId": "string (required)",
  "targetDirectory": "string (optional, default: confluence-downloads/)",
  "format": "string (optional, default: markdown)",
  "includeMetadata": "boolean (optional, default: true)"
}
```

**Example Usage:**
```json
{
  "tool": "confluence_download_page",
  "parameters": {
    "pageId": "123456789",
    "targetDirectory": "./downloads"
  }
}
```

**Response:**
```json
{
  "success": true,
  "filePath": "./downloads/123456789-api-documentation.md",
  "title": "API Documentation",
  "spaceKey": "DOCS",
  "webUrl": "https://company.atlassian.net/wiki/spaces/DOCS/pages/123456789",
  "contentSize": 2048,
  "lastModified": "2024-01-15T10:30:00Z"
}
```

**File Output Format:**
```markdown
---
pageId: 123456789
title: API Documentation
spaceKey: DOCS
webUrl: https://company.atlassian.net/wiki/spaces/DOCS/pages/123456789
lastModified: 2024-01-15T10:30:00Z
---

# API Documentation

> **Info:** This is an information panel
> **Warning:** This is a warning panel

## Getting Started

Content here...
```

### confluence_upload_page

Upload Markdown file to Confluence (create or update).

**Input Schema:**
```json
{
  "filePath": "string (required)",
  "mode": "string (required: create|update)",
  "spaceKey": "string (required for create)",
  "title": "string (optional, uses filename or frontmatter)",
  "parentPageId": "string (optional)",
  "versionComment": "string (optional)"
}
```

**Create Mode Example:**
```json
{
  "tool": "confluence_upload_page",
  "parameters": {
    "filePath": "./new-guide.md",
    "mode": "create",
    "spaceKey": "DOCS",
    "title": "New User Guide",
    "parentPageId": "987654321"
  }
}
```

**Update Mode Example:**
```json
{
  "tool": "confluence_upload_page", 
  "parameters": {
    "filePath": "./downloads/123456789-api-documentation.md",
    "mode": "update",
    "versionComment": "Updated authentication section"
  }
}
```

**Response:**
```json
{
  "success": true,
  "pageId": "123456789",
  "title": "API Documentation",
  "webUrl": "https://company.atlassian.net/wiki/spaces/DOCS/pages/123456789",
  "version": 5,
  "operation": "update"
}
```

### create_confluence_content

Create new Confluence content using ADF format.

**Input Schema:**
```json
{
  "spaceId": "string (required)",
  "title": "string (required)",
  "body": "object (required, ADF format)",
  "type": "string (optional, default: page)",
  "status": "string (optional, default: current)",
  "parentId": "string (optional)"
}
```

**Example Usage:**
```json
{
  "tool": "create_confluence_content",
  "parameters": {
    "spaceId": "12345",
    "title": "New Documentation",
    "body": {
      "version": 1,
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 1 },
          "content": [{ "type": "text", "text": "Welcome" }]
        }
      ]
    }
  }
}
```

### read_confluence_content

Read content from Confluence pages in ADF format.

**Input Schema:**
```json
{
  "pageId": "string (required)",
  "version": "number (optional, default: current)",
  "format": "string (optional, default: adf)"
}
```

### update_confluence_content

Update existing Confluence content.

**Input Schema:**
```json
{
  "pageId": "string (required)",
  "title": "string (optional)",
  "body": "object (required, ADF format)",
  "version": "number (required)",
  "versionComment": "string (optional)"
}
```

### delete_confluence_content

Delete Confluence pages or blog posts.

**Input Schema:**
```json
{
  "pageId": "string (required)",
  "permanent": "boolean (optional, default: false)"
}
```

## Search and Discovery Tools

### search_confluence_pages

Search for Confluence pages using CQL (Confluence Query Language).

**Input Schema:**
```json
{
  "cql": "string (required)",
  "limit": "number (optional, default: 25, max: 250)",
  "start": "number (optional, default: 0)",
  "expand": "array (optional)",
  "includeArchivedSpaces": "boolean (optional, default: false)"
}
```

**Example Usage:**
```json
{
  "tool": "search_confluence_pages",
  "parameters": {
    "cql": "space = \"DOCS\" AND type = page AND title ~ \"API\"",
    "limit": 10,
    "expand": ["body.view", "version", "space"]
  }
}
```

**Common CQL Patterns:**
```cql
# Search by space and title
space = "DOCS" AND title ~ "authentication"

# Recent pages by author  
contributor = "john.doe" AND lastModified >= "-30d"

# Pages with specific labels
label in ("api", "documentation") AND space = "DOCS"

# Content text search
text ~ "OAuth" AND space = "DOCS"

# Complex queries
space = "DOCS" AND type = page AND (title ~ "API" OR text ~ "endpoint")
```

**Response:**
```json
{
  "results": [
    {
      "id": "123456789",
      "title": "API Documentation", 
      "type": "page",
      "status": "current",
      "space": {
        "key": "DOCS",
        "name": "Documentation"
      },
      "version": {
        "number": 3,
        "when": "2024-01-15T10:30:00Z"
      },
      "_links": {
        "webui": "/wiki/spaces/DOCS/pages/123456789"
      }
    }
  ],
  "size": 1,
  "totalSize": 1,
  "limit": 25
}
```

### list_confluence_spaces

List all Confluence spaces accessible to the user.

**Input Schema:**
```json
{
  "type": "string (optional: global|personal)",
  "status": "string (optional: current|archived)",
  "limit": "number (optional, default: 25)",
  "start": "number (optional, default: 0)",
  "expand": "array (optional)"
}
```

**Example Usage:**
```json
{
  "tool": "list_confluence_spaces",
  "parameters": {
    "type": "global",
    "status": "current",
    "limit": 50
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": 12345,
      "key": "DOCS",
      "name": "Documentation",
      "description": {
        "plain": {
          "value": "Company documentation space"
        }
      },
      "type": "global",
      "status": "current",
      "_links": {
        "webui": "/wiki/spaces/DOCS"
      }
    }
  ],
  "size": 1,
  "limit": 25
}
```

### get_page_versions

Get version history for a Confluence page.

**Input Schema:**
```json
{
  "pageId": "string (required)",
  "limit": "number (optional, default: 25)",
  "start": "number (optional, default: 0)"
}
```

**Response:**
```json
{
  "results": [
    {
      "number": 3,
      "when": "2024-01-15T10:30:00Z",
      "message": "Updated authentication section",
      "by": {
        "displayName": "John Doe",
        "accountId": "abc123"
      },
      "minorEdit": false
    }
  ]
}
```

### get_page_metadata

Get detailed metadata and properties for a page.

**Input Schema:**
```json
{
  "pageId": "string (required)",
  "expand": "array (optional)"
}
```

## Template Tools

### list_available_templates

List all YAML templates available for content generation.

**Input Schema:**
```json
{
  "category": "string (optional)",
  "sections": "array (optional)"
}
```

**Example Usage:**
```json
{
  "tool": "list_available_templates",
  "parameters": {
    "category": "api-documentation"
  }
}
```

**Response:**
```json
{
  "templates": [
    {
      "name": "REST API Documentation",
      "description": "Complete REST API documentation with endpoints",
      "version": "2.1.0",
      "category": "api-documentation", 
      "sections": ["authentication", "endpoints", "examples"],
      "filePath": "templates/yaml/rest-api-documentation.yml",
      "userContextRequired": {
        "service_name": "What is your service name?",
        "base_url": "What is the API base URL?"
      }
    }
  ],
  "totalCount": 1,
  "categories": ["api-documentation", "user-guides", "technical-specs"]
}
```

### generate_from_template

Generate content using a YAML template.

**Input Schema:**
```json
{
  "templateName": "string (required)",
  "userContext": "object (required)",
  "outputPath": "string (optional)",
  "format": "string (optional, default: markdown)"
}
```

**Example Usage:**
```json
{
  "tool": "generate_from_template",
  "parameters": {
    "templateName": "rest-api-documentation",
    "userContext": {
      "service_name": "Payment API",
      "base_url": "https://api.company.com/v1",
      "auth_method": "API Key"
    },
    "outputPath": "./generated-api-docs.md"
  }
}
```

**Response:**
```json
{
  "success": true,
  "outputPath": "./generated-api-docs.md",
  "templateUsed": "rest-api-documentation v2.1.0",
  "contentLength": 3456,
  "sectionsGenerated": 5,
  "adfPath": "./generated-api-docs.adf.json"
}
```

### validate_template

Validate YAML template structure and syntax.

**Input Schema:**
```json
{
  "templatePath": "string (required)"
}
```

**Response:**
```json
{
  "valid": true,
  "template": {
    "name": "REST API Documentation",
    "version": "2.1.0"
  },
  "warnings": [],
  "errors": []
}
```

## Error Handling

### Standard Error Format

All tools return errors in consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "Additional error context"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "uuid-string"
}
```

### Common Error Codes

| Error Code | Description | Recovery Action |
|------------|-------------|-----------------|
| `AUTH_REQUIRED` | Authentication needed | Run OAuth flow |
| `AUTH_EXPIRED` | Tokens expired | Refresh or re-authenticate |
| `INVALID_PAGE_ID` | Page not found | Verify page ID and permissions |
| `INSUFFICIENT_PERMISSIONS` | Missing permissions | Check OAuth scopes |
| `RATE_LIMITED` | Too many requests | Wait and retry with backoff |
| `NETWORK_ERROR` | Connection issues | Check connectivity |
| `TEMPLATE_NOT_FOUND` | Template missing | Verify template name |
| `VALIDATION_ERROR` | Invalid input | Check parameter format |

### Retry Logic

Tools automatically retry transient errors with exponential backoff:

```json
{
  "retryConfig": {
    "maxRetries": 3,
    "baseDelay": 1000,
    "maxDelay": 10000,
    "backoffMultiplier": 2,
    "retryableErrors": [
      "NETWORK_ERROR",
      "RATE_LIMITED", 
      "SERVER_ERROR"
    ]
  }
}
```

## Usage Patterns

### Basic Workflow

1. **Authenticate**: `confluence_oauth_init` → `confluence_oauth_complete`
2. **Discover**: `list_confluence_spaces`, `search_confluence_pages`
3. **Read**: `confluence_download_page`, `read_confluence_content`  
4. **Edit**: Local editing with preferred tools
5. **Write**: `confluence_upload_page`, `update_confluence_content`

### Template Workflow

1. **Discover**: `list_available_templates`
2. **Generate**: `generate_from_template` with user context
3. **Create**: `confluence_upload_page` or `create_confluence_content`
4. **Iterate**: Update templates and regenerate as needed

### Batch Operations

```json
// Search for multiple pages
{
  "tool": "search_confluence_pages",
  "parameters": {
    "cql": "space = \"DOCS\" AND label = \"needs-update\"",
    "limit": 100
  }
}

// Process each page
// For each result: download → edit → upload
```

## Best Practices

### Authentication
- Use OAuth 2.0 for production workflows
- Check `confluence_oauth_status` before operations
- Handle token refresh automatically

### Content Management  
- Always use `confluence_download_page` for editing existing content
- Preserve metadata in YAML frontmatter
- Test ADF conversion before bulk operations

### Error Handling
- Implement retry logic for transient errors
- Validate inputs before API calls
- Log errors with request IDs for debugging

### Performance
- Use appropriate `limit` values for searches
- Cache frequently accessed content
- Batch related operations when possible

## Tool Discovery in Claude

To see all available tools in Claude Code:

```
What Confluence tools do you have available?
```

This will display a categorized list of all MCP tools with brief descriptions, making it easy to discover and use the appropriate tools for your workflow.

## Next Steps

- **[Confluence Content Tools](./confluence-content-tools.md)** - Detailed tool usage examples
- **[Template System](./template-system.md)** - Working with YAML templates
- **[Error Handling](./error-handling.md)** - Comprehensive troubleshooting guide
- **[Authentication Setup](./authentication-setup.md)** - OAuth configuration details