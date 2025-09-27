# MCP Confluence ADF Server

[![npm version](https://badge.fury.io/js/mcp-confluence-adf.svg)](https://www.npmjs.com/package/mcp-confluence-adf)

A Model Context Protocol (MCP) server for Confluence content management using Atlassian Document Format (ADF) with bidirectional Markdown conversion for easy editing.

**=� Available on npm:** `mcp-confluence-adf`

## Features

- **OAuth 2.0 authentication** with secure token management and automatic refresh
- **Direct REST API integration** with Confluence Cloud V2 API
- **ADF to Markdown bidirectional conversion** for easy editing
- **File-based workflows** with local storage in `confluence-downloads/` directory
- **Full CRUD operations** for Confluence pages and content
- **User-accessible file storage** with page ID prefixes to prevent overwrites
- **Rich content preservation** (panels, tables, code blocks, mentions, emojis)
- **Version management** with metadata tracking
- **Offline editing** support with local Markdown files

## Installation

### NPM Package Install (Recommended)

**1. Install the package globally:**
```bash
yarn global add mcp-confluence-adf
```

**2. Add the server configuration:**

**Option A: Using Claude CLI (Recommended):**
```bash
claude mcp add --scope user mcp-confluence-adf npx mcp-confluence-adf
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
yarn global add mcp-confluence-adf
```

**Quick test without install:**
```bash
npx mcp-confluence-adf --help
```

## Uninstall

To completely remove the MCP server:

**1. Remove from Claude configuration:**
```bash
claude mcp remove mcp-confluence-adf
```

**2. Uninstall the package:**
```bash
yarn global remove mcp-confluence-adf
```

## How It Works

### 1. OAuth Authentication Setup (One Time)

**You:** "Set up OAuth authentication with Confluence"

**Claude Code:** Uses `confluence_oauth_init` and `confluence_oauth_complete` tools

**Result:** Secure OAuth 2.0 authentication with automatic token refresh for all subsequent operations

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

#### OAuth 2.0 Authentication (Primary Method)

OAuth 2.0 provides secure, scoped access to Confluence with automatic token refresh.

##### `confluence_oauth_init`
Initialize OAuth 2.0 authentication flow.

**Input:**
```json
{
  "clientId": "your-oauth-client-id",
  "clientSecret": "your-oauth-client-secret",
  "redirectUri": "http://localhost:9000/oauth/callback"
}
```

**Setup Requirements:**
1. Create an OAuth 2.0 app in [Atlassian Developer Console](https://developer.atlassian.com/console/)
2. Configure callback URL: `http://localhost:9000/oauth/callback` (port 9000 is recommended)
3. **Required OAuth Scopes (add all of these to your Atlassian app):**
   - `read:confluence-content.all`
   - `write:confluence-content`
   - `read:content:confluence`
   - `write:content:confluence`
   - `read:space:confluence`
   - `read:page:confluence`
   - `write:page:confluence`
   - `read:confluence-content.summary`
   - `read:confluence-space.summary`
   - `search:confluence`
   - `offline_access`

**OAuth Flow:**
```bash
# 1. Initialize OAuth flow
confluence_oauth_init({
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret"
})

# 2. Visit the generated authorization URL in your browser
# 3. Grant permissions to the application

# 4. Complete authentication
confluence_oauth_complete({
  "openBrowser": true
})

# 5. Check status
confluence_oauth_status()
```

##### `confluence_oauth_complete`
Complete OAuth authentication after visiting authorization URL.

**Input:**
```json
{
  "openBrowser": true
}
```

##### `confluence_oauth_status`
Check current OAuth authentication status.

##### `confluence_oauth_clear`
Clear OAuth authentication and tokens.

### File-Based Workflows

#### `confluence_download_page`
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

#### `confluence_upload_page`
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

### OAuth 2.0 Authentication (Required - One-Time Setup)
```bash
# 1. Initialize OAuth (one-time setup)
confluence_oauth_init({
  "clientId": "your-client-id-from-developer-console",
  "clientSecret": "your-client-secret-from-developer-console"
})

# 2. Complete authentication (browser opens automatically)
confluence_oauth_complete({
  "openBrowser": true
})

# 3. Verify authentication
confluence_oauth_status()
```

### Edit Existing Page
```bash
# 1. Download page for editing
confluence_download_page({
  "pageId": "123456789"
})
# → Creates confluence-downloads/123456789-page-title.md

# 2. Edit the Markdown file in your preferred editor

# 3. Upload changes back to Confluence
confluence_upload_page({
  "filePath": "confluence-downloads/123456789-page-title.md"
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

## OAuth 2.0 Setup

### Step 1: Create OAuth 2.0 App in Atlassian Developer Console

#### Access Developer Console
1. Go to **[developer.atlassian.com](https://developer.atlassian.com)**
2. Select your **profile icon**
3. Choose **"Developer console"**

#### Create Your App
4. Select **"Create app"** 
5. Give your app a descriptive name (e.g., "Confluence MCP Integration")

#### Configure OAuth 2.0 Authorization
6. Select **"Authorization"** in the left menu
7. Next to **OAuth 2.0 (3LO)**, select **"Configure"**
8. Enter your **"Callback URL"** (e.g., `http://localhost:9000/oauth/callback`)
   - ⚠️ **Important**: This URL must match the `redirect_uri` in your authorization requests
9. Click **"Save changes"**

#### Add API Permissions
10. Select **"Permissions"** in the left menu
11. Next to **Confluence API**, select **"Add"**
12. Choose these **required scopes**:

**Required OAuth Scopes:**
- `read:confluence-content.all` - Read all Confluence content
- `write:confluence-content` - Create and edit Confluence content
- `read:content:confluence` - Read content (granular scope)
- `write:content:confluence` - Write content (granular scope)
- `read:space:confluence` - Access spaces (granular scope)
- `read:page:confluence` - Read pages (granular scope)
- `write:page:confluence` - Create/edit pages (granular scope)
- `read:confluence-content.summary` - Read content summaries (granular scope)
- `read:confluence-space.summary` - Read space information (granular scope)
- `search:confluence` - Search functionality (granular scope)
- `offline_access` - Token refresh

#### Get Your Credentials
13. Go to **"Settings"** in the left menu
14. Copy your **Client ID** and **Client Secret**
15. **Keep these credentials secure!**

### Step 2: Initialize OAuth in Claude Code

#### Start OAuth Flow
```bash
confluence_oauth_init({
  "clientId": "your-client-id-from-developer-console",
  "clientSecret": "your-client-secret-from-developer-console"
})
```

This automatically:
- Starts a local callback server on an available port
- Generates a secure authorization URL with PKCE security
- Displays the URL to visit for authorization

#### Complete Authorization
```bash
confluence_oauth_complete({
  "openBrowser": true
})
```

### Step 3: Browser Authorization Flow

When you run `confluence_oauth_complete`:

1. **Browser opens** to Atlassian's authorization page
2. **Sign in** to your Atlassian account
3. **Review permissions** - you'll see the scopes you configured
4. **Click "Accept"** to grant permissions to your app
5. **Automatic redirect** back to the callback server
6. **Success confirmation** displays "Authentication Successful!"
7. **Window closes** automatically

### Step 4: Persistent Authentication Ready

After successful authorization:
- **Tokens stored securely** in `~/.mcp/confluence-adf/oauth-tokens.json` (or macOS Keychain)
- **Auto-refresh enabled** - tokens refresh automatically before expiry
- **Survives server restarts** - no need to re-authenticate
- **Ready for all operations** - download, upload, search, CRUD

### Verify Your Setup

```bash
confluence_oauth_status()
```

Expected output:
```
✅ OAuth Authentication Active

🔐 Status: Connected
🌐 Cloud ID: [your-cloud-id]
🔧 Client Configured: Yes
⚡ Ready for API calls: Yes
💾 Token Storage: keychain (macOS Keychain) OR file (~/.mcp/confluence-adf/oauth-tokens.json)
```

### Managing Authentication

#### Clear Authentication (if needed)
```bash
confluence_oauth_clear()
```

**This is a one-time setup!** Once completed, your OAuth authentication persists across all future Claude Code sessions automatically with secure token refresh.


## Templates System

### Overview

The MCP Confluence ADF server includes a powerful templates system that allows users and Claude to generate structured Confluence pages from YAML template definitions. Templates provide a standardized way to create consistent, high-quality documentation.

### Template Structure

Templates are defined in YAML format and consist of:

1. **Metadata** - Template name, description, version, category
2. **User Context Requirements** - Variables that need to be provided
3. **Structure Definition** - The actual content structure and instructions

#### Example Template Structure
```yaml
---
name: Simple Getting Started Guide
description: A basic getting started template for any project or service
version: 1.0.0
category: user-guide
output_type: structured_template
sections:
  - introduction
  - installation
  - basic_usage
  - troubleshooting
user_context_required:
  project_name: "What is the name of your project or service?"
  main_technology: "What is the main technology stack (e.g., Node.js, Python, React)?"
---

structure:
  - "# Getting Started with {{project_name}}"
  
  - type: info_panel
    title: "Welcome"
    content_instruction: "Create a welcoming introduction that explains what {{project_name}} does and why users should be excited to use it"
    purpose: "Set a positive tone and provide project overview"
  
  - "## Installation"
  - type: code_block
    title: "Quick Install"
    language: "bash"
    content_instruction: "Provide the simplest installation command for {{project_name}} using yarn or the most common package manager for {{main_technology}}"
    purpose: "Get users up and running quickly"
```

### Available Template Types

#### Content Block Types
- **Plain Text**: Direct markdown content (headings, paragraphs)
- **Panels**: `info_panel`, `warning_panel`, `success_panel`, `error_panel`
- **Code Blocks**: With language specification and syntax highlighting
- **Expandable Sections**: Collapsible content blocks
- **Tables**: Structured data presentation
- **Sections**: Reusable content blocks with descriptions

#### Template Variables
- Use `{{variable_name}}` syntax for substitution
- Variables defined in `user_context_required` section
- Automatically replaced during generation

### Process Flow: Templates → Confluence Pages

#### 1. Template Selection
**User Request**: "Create a getting started guide for my Node.js API"

**Claude Code**: 
- Analyzes available templates in `/templates/yaml/`
- Selects appropriate template (e.g., `simple-getting-started.yml`)
- Identifies required user context variables

#### 2. Context Gathering  
**Claude Code**: 
- Prompts user for required variables:
  - `project_name`: "Node.js API Server"
  - `main_technology`: "Node.js with Express"
- Collects additional context through conversation

#### 3. Content Generation
**Claude Code**:
- Processes template structure section by section
- Substitutes variables: `{{project_name}}` → "Node.js API Server"
- Generates content based on `content_instruction` fields
- Follows `purpose` guidelines for each section

#### 4. Markdown Creation
**Generated Output** (saved to `test-files/`):
```markdown
---
template: simple-getting-started
generated: 2024-01-15T10:30:00Z
variables:
  project_name: Node.js API Server
  main_technology: Node.js with Express
---

# Getting Started with Node.js API Server

> ℹ️ **Welcome:** This guide will help you get up and running with Node.js API Server, a powerful and flexible API solution built with Node.js and Express. You'll be building and deploying APIs in minutes!

## Prerequisites

### Requirements
Before installing Node.js API Server, ensure you have:
- Node.js v18.0.0 or higher
- yarn v1.22.0 or higher
- Git for version control

## Installation

```bash
yarn global add nodejs-api-server
```

### Verification
Verify your installation by running:
```bash
nodejs-api-server --version
```

## Basic Usage

### First Steps
Create your first API endpoint with this simple example:

```javascript
const api = require('nodejs-api-server');

api.get('/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

api.listen(3000);
```

> ✅ **You're All Set!:** Congratulations! Your Node.js API Server is now running. Visit the full documentation to learn about advanced features like authentication, middleware, and database integration.
```

#### 5. ADF Conversion
**Automatic Process**:
- Markdown content is automatically converted to ADF JSON format
- Rich content elements (panels, code blocks, tables) are preserved
- Saved to `test-files/converted-adf/` directory
- Ready for upload to Confluence

#### 6. Confluence Upload
**Claude Code**: Uses `confluence_upload_page` or `create_confluence_content`:
```json
{
  "filePath": "test-files/generated-getting-started.md",
  "mode": "create",
  "spaceKey": "DOCS",
  "title": "Getting Started with Node.js API Server"
}
```

### Using Templates with Claude

#### For Users
**Simple Request**: "Create documentation for my Python web scraper using a template"

**Claude Response**:
1. Reviews available templates
2. Asks for required context (project name, technology stack, etc.)
3. Generates structured content following template guidelines
4. Creates both Markdown and ADF versions
5. Optionally uploads directly to Confluence

#### For Claude Code
**Template Processing**:
1. **Parse YAML**: Load template structure and metadata
2. **Validate Context**: Ensure all required variables are available
3. **Process Structure**: Iterate through structure array
4. **Generate Content**: Create content based on instructions and context
5. **Apply Variables**: Substitute all `{{variable}}` placeholders
6. **Output Format**: Generate both Markdown and ADF versions

### Template Development

#### Adding New Templates
1. Create YAML file in `/templates/yaml/`
2. Define metadata and user context requirements
3. Structure content with clear instructions
4. Test with various user contexts
5. Generate examples in `/test-files/`

#### Template Best Practices
- **Clear Instructions**: Provide specific `content_instruction` for each section
- **Flexible Variables**: Use meaningful variable names with helpful descriptions
- **Rich Content**: Leverage panels, code blocks, and expandables appropriately
- **User-Focused**: Design structure around user needs and workflows

### Content Update Flow

#### Template → Markdown → ADF → Confluence
```
YAML Template
    ↓ (Claude processes structure)
Markdown File (test-files/)
    ↓ (Automatic ADF conversion)
ADF JSON (test-files/converted-adf/)
    ↓ (Upload via MCP tools)
Confluence Page
```

#### Iterative Updates
1. **Modify Template**: Update YAML structure or instructions
2. **Regenerate Content**: Claude processes updated template
3. **Review Changes**: Compare new Markdown output
4. **Update Confluence**: Upload revised content to existing pages

This templates system enables rapid, consistent documentation creation while maintaining quality and structure across all generated content.

## License

MIT

## Important References
https://developer.atlassian.com/cloud/jira/platform/jira-entity-properties/