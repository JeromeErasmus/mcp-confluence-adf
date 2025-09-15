# MCP Confluence ADF Server

[![npm version](https://badge.fury.io/js/mcp-confluence-adf.svg)](https://www.npmjs.com/package/mcp-confluence-adf)

A Model Context Protocol (MCP) server for Confluence content management using Atlassian Document Format (ADF) with bidirectional Markdown conversion for easy editing.

**=� Available on npm:** `mcp-confluence-adf`

## Features

- **Direct REST API integration** with Confluence using API tokens
- **ADF to Markdown bidirectional conversion** for easy editing
- **File-based workflows** with local storage in `confluence-downloads/` directory
- **Full CRUD operations** for Confluence pages and content
- **User-accessible file storage** with page ID prefixes to prevent overwrites
- **Rich content preservation** (panels, tables, code blocks, mentions, emojis)
- **Version management** with metadata tracking
- **Offline editing** support with local Markdown files

## Installation

### NPM Package Install (Recommended)

**1. Install the package from npm:**
```bash
npm install -g mcp-confluence-adf
```

**2. Add the server configuration:**

**Option A: Using Claude CLI (Recommended):**
```bash
claude mcp add-json --scope user mcp-confluence-adf '{"command":"npx","args":["mcp-confluence-adf"]}'
```

**Option B: Manual configuration file edit:**
```bash
code ~/.config/claude/settings.json
```

**3. (Manual option only) Add the server configuration to the `"mcp"` � `"servers"` section:**
```json
{
  "mcp": {
    "servers": {
      "mcp-confluence-adf": {
        "command": "npx",
        "args": ["mcp-confluence-adf"]
      }
    }
  }
}
```

**4. Restart Claude Code**

### Development Install (Local)

**For development or customization:**
```bash
# Clone and build from source
git clone https://github.com/JeromeErasmus/mcp-confluence-adf.git
cd mcp-confluence-adf
yarn install
yarn build
```

**Add to Claude Code MCP configuration (`~/.config/claude/settings.json`):**

Add this to the `"mcp"` � `"servers"` section:
```json
{
  "mcp": {
    "servers": {
      "mcp-confluence-adf": {
        "command": "node",
        "args": ["/absolute/path/to/mcp-confluence-adf/dist/server.js"]
      }
    }
  }
}
```

### Alternative Install Methods

**Global install:**
```bash
npm install -g mcp-confluence-adf
```

**Quick test without install:**
```bash
npx mcp-confluence-adf --help
```

## How It Works

### 1. Authentication Setup (One Time)

**You:** "Authenticate with Confluence"

**Claude Code:** Uses `authenticate` tool with your base URL and API token

**Result:** Secure session-based authentication for all subsequent operations

### 2. Download and Edit Workflow

**Scenario: "Download and edit a Confluence page"**

**Claude Code:** Uses `download_page({ pageId: "123456789" })`

**Result:** 
- Downloads page as Markdown with YAML frontmatter
- Saves to `confluence-downloads/123456789-page-title.md`
- Preserves metadata for accurate re-upload
- Converts ADF rich content to Markdown equivalents

**Edit locally, then:**

**Claude Code:** Uses `upload_page({ filePath: "...", mode: "update" })`

**Result:** Converts Markdown back to ADF and updates Confluence page

### 3. Create New Content

**Scenario: "Create a new Confluence page"**

**Claude Code:** Uses `create_confluence_content` or `upload_page` with mode='create'

**Result:** Creates new page in specified space with ADF content

### 4. File-Based Workflows

**Local file storage with smart naming:**
- Files saved as `{pageId}-{safe-title}.md`
- Stored in `confluence-downloads/` directory (current working directory preferred)
- YAML frontmatter preserves page metadata
- Separate `.meta.json` files track original ADF for accurate updates

## MCP Tools Reference

### Authentication

#### `authenticate`
Set up authentication with your Confluence instance using API token.

**Input:**
```json
{
  "baseUrl": "https://yourcompany.atlassian.net",
  "email": "your.email@company.com",
  "apiToken": "ATATT3xFfGF0T..."
}
```

**Parameters:**
- `baseUrl`: Your Confluence base URL
- `email`: Your Atlassian account email address
- `apiToken`: Your Confluence API token (create at Account Settings � Security � API tokens)

### File-Based Workflows

#### `download_page`
Download a Confluence page as a Markdown file for local editing.

**Input:**
```json
{
  "pageId": "123456789",
  "targetDirectory": "optional/custom/path"
}
```

**Parameters:**
- `pageId`: Confluence page ID (extract from page URL)
- `targetDirectory`: Optional custom directory (defaults to `confluence-downloads/`)

**File Output:**
```markdown
---
pageId: 123456789
title: Page Title
spaceKey: DEV
webUrl: https://company.atlassian.net/wiki/spaces/DEV/pages/123456789
---

# Page Content

> 9 **Info:** Rich content blocks are preserved as Markdown
```

#### `upload_page`
Upload a Markdown file to Confluence (create new or update existing).

**Input:**
```json
{
  "filePath": "confluence-downloads/123456789-page-title.md",
  "mode": "update"
}
```

**Create Mode Input:**
```json
{
  "filePath": "new-document.md",
  "mode": "create",
  "spaceKey": "DEV",
  "title": "New Page Title",
  "parentPageId": "456789123"
}
```

**Parameters:**
- `filePath`: Path to Markdown file
- `mode`: "create" or "update"
- `spaceKey`: Required for create mode
- `title`: Required for create mode
- `parentPageId`: Optional parent page for hierarchy

### Core CRUD Operations

#### `create_confluence_content`
Create new Confluence pages or blog posts using ADF format.

#### `read_confluence_content`
Read content from Confluence pages in ADF format.

#### `update_confluence_content`
Update existing Confluence pages with new ADF content.

#### `delete_confluence_content`
Delete Confluence pages.

#### `list_confluence_spaces`
List all accessible Confluence spaces.

### Search and Management

#### `search_confluence_pages`
Search for Confluence pages using CQL (Confluence Query Language).

#### `get_page_versions`
Get version history of a Confluence page.

#### `manage_page_labels`
Add or remove labels on Confluence pages.

## File Storage System

### Storage Location Priority Order
1. **Current working directory** + `/confluence-downloads`
2. **User-configured directory** (if set via configuration)
3. **Home directory** + `/confluence-downloads`

### File Naming Convention
- Format: `{pageId}-{safe-title}.md`
- Example: `123456789-team-onboarding-guide.md`
- Page ID prefix prevents filename conflicts

### Metadata Preservation
- **YAML frontmatter** in Markdown files with page metadata
- **Separate `.meta.json` files** for upload tracking
- **Original ADF stored** in metadata for accurate re-upload
- **Permanent storage** (no automatic cleanup)

## Rich Content Support

### ADF to Markdown Conversion
Rich Confluence content is converted to Markdown equivalents:

```markdown
# ADF Panels � Markdown Blockquotes
> 9 **Info:** Information panels
> � **Warning:** Warning panels  
>  **Success:** Success panels
> =� **Note:** Note panels

# Tables � Standard Markdown Tables
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |

# Code Blocks � Fenced Code Blocks
```javascript
function example() {
  return "preserved formatting";
}
```

# Rich Text � Markdown Formatting
**Bold text**, *italic text*, `inline code`
[Link text](https://example.com)
@mentions and :emoji: support
```

## Typical Workflow

### Edit Existing Page
```bash
# 1. Authenticate (once per session)
authenticate({
  "baseUrl": "https://company.atlassian.net",
  "email": "your.email@company.com",
  "apiToken": "ATATT3xFfGF0..."
})

# 2. Download page for editing
download_page({
  "pageId": "123456789"
})
# � Creates confluence-downloads/123456789-page-title.md

# 3. Edit the Markdown file in your preferred editor

# 4. Upload changes back to Confluence
upload_page({
  "filePath": "confluence-downloads/123456789-page-title.md",
  "mode": "update"
})
```

### Create New Page
```bash
# 1. Create local Markdown file or use existing
# 2. Upload as new page
upload_page({
  "filePath": "new-document.md",
  "mode": "create",
  "spaceKey": "DEV",
  "title": "New Team Guide"
})
```

## Development

```bash
yarn dev      # Development mode
yarn build    # Build TypeScript
yarn test     # Run tests
yarn clean    # Clean build directory
```

## Configuration

The system automatically handles:
- **File storage** in appropriate directories
- **Content conversion** between ADF and Markdown
- **Metadata preservation** for accurate uploads
- **Rich content** formatting preservation

## API Token Setup

1. Go to your Atlassian Account Settings
2. Navigate to Security � API tokens
3. Create a new API token
4. Copy the token for use with the `authenticate` tool

## License

MIT