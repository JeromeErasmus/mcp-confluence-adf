# MCP Tool Discovery & Usage

Learn how to discover and use all available MCP tools in the Confluence ADF server with Claude Code.

## Discovering Available Tools

### Method 1: Ask Claude to List Tools

The simplest way to see all available tools is to ask Claude directly:

```
Show me all available MCP tools for Confluence
```

or

```
What Confluence tools do you have access to?
```

Claude will automatically discover and list all registered MCP tools from the `mcp-confluence-adf` server.

### Method 2: Claude Code Tool Inspector

In Claude Code, you can view available MCP tools:

1. **Open Tool Inspector**: Use the command palette or menu to access MCP tool information
2. **Filter by Server**: Look for `mcp-confluence-adf` server
3. **Browse Tools**: See all available tools with descriptions

### Method 3: Help Command

Ask for specific tool help:

```
Help me understand the confluence_download_page tool
```

```
Show me the parameters for create_confluence_content
```

## Available MCP Tools Reference

### Authentication Tools

#### `confluence_oauth_init`
**Purpose**: Initialize OAuth 2.0 authentication flow  
**Usage**: `Set up OAuth authentication with my Confluence instance`

**Parameters**:
- `clientId` (string) - OAuth client ID from Atlassian Developer Console
- `clientSecret` (string) - OAuth client secret
- `redirectUri` (string, optional) - Callback URL (default: http://localhost:9000/oauth/callback)

**Example**:
```
Initialize OAuth with client ID abc123 and client secret xyz789
```

#### `confluence_oauth_complete`
**Purpose**: Complete OAuth authentication after authorization  
**Usage**: `Complete the OAuth authentication process`

**Parameters**:
- `openBrowser` (boolean, optional) - Whether to open browser automatically

**Example**:
```
Complete OAuth authentication and open browser
```

#### `confluence_oauth_status`
**Purpose**: Check current OAuth authentication status  
**Usage**: `Check my Confluence authentication status`

**Example**:
```
Am I authenticated with Confluence?
```

#### `confluence_oauth_clear`
**Purpose**: Clear OAuth authentication and tokens  
**Usage**: `Clear my Confluence authentication`

**Example**:
```
Reset my Confluence authentication
```

### Content Management Tools

#### `confluence_download_page`
**Purpose**: Download Confluence page as Markdown for local editing  
**Usage**: `Download page [PAGE_ID] for editing`

**Parameters**:
- `pageId` (string) - Confluence page ID
- `targetDirectory` (string, optional) - Custom download directory

**Example**:
```
Download page 123456789 to edit locally
```

#### `confluence_upload_page`
**Purpose**: Upload Markdown file to Confluence (create/update)  
**Usage**: `Upload [FILE_PATH] to Confluence`

**Parameters**:
- `filePath` (string) - Path to Markdown file
- `mode` (string) - "create" or "update"
- `spaceKey` (string, required for create) - Target space
- `title` (string, required for create) - Page title
- `parentPageId` (string, optional) - Parent page ID

**Examples**:
```
Upload confluence-downloads/123456789-guide.md back to Confluence
```
```
Create new page from my-guide.md in DOCS space titled "Team Guide"
```

#### `create_confluence_content`
**Purpose**: Create new Confluence pages or blog posts  
**Usage**: `Create a new page in [SPACE] titled [TITLE]`

**Parameters**:
- `spaceKey` (string) - Target space key
- `title` (string) - Page title
- `content` (object) - ADF content object
- `type` (string, optional) - "page" or "blog" (default: page)
- `parentId` (string, optional) - Parent page ID

**Example**:
```
Create a new page in DOCS space titled "API Documentation" with content about our REST API
```

#### `read_confluence_content`
**Purpose**: Read content from Confluence pages  
**Usage**: `Read content from page [PAGE_ID]`

**Parameters**:
- `pageId` (string) - Page ID to read
- `expand` (string, optional) - Additional data to include

**Example**:
```
Read content from page 987654321
```

#### `update_confluence_content`
**Purpose**: Update existing Confluence pages  
**Usage**: `Update page [PAGE_ID] with new content`

**Parameters**:
- `pageId` (string) - Page ID to update
- `content` (object) - New ADF content
- `version` (number) - Current version number
- `title` (string, optional) - New title

**Example**:
```
Update page 123456789 with new API documentation content
```

#### `delete_confluence_content`
**Purpose**: Delete Confluence pages  
**Usage**: `Delete page [PAGE_ID]`

**Parameters**:
- `pageId` (string) - Page ID to delete

**Example**:
```
Delete page 123456789
```

### Search & Discovery Tools

#### `search_confluence_pages`
**Purpose**: Search Confluence pages using CQL  
**Usage**: `Search for pages containing [TERMS]`

**Parameters**:
- `cql` (string) - Confluence Query Language expression
- `limit` (number, optional) - Maximum results (default: 25)
- `start` (number, optional) - Start index for pagination

**Examples**:
```
Search for pages containing "API documentation" in the DOCS space
```
```
Find pages modified in the last week by john.doe
```

#### `list_confluence_spaces`
**Purpose**: List all accessible Confluence spaces  
**Usage**: `Show me all my Confluence spaces`

**Parameters**:
- `limit` (number, optional) - Maximum spaces to return
- `type` (string, optional) - Filter by space type

**Example**:
```
List all my Confluence spaces
```

#### `get_page_versions`
**Purpose**: Get version history of a Confluence page  
**Usage**: `Show version history for page [PAGE_ID]`

**Parameters**:
- `pageId` (string) - Page ID
- `limit` (number, optional) - Number of versions to return

**Example**:
```
Show version history for page 123456789
```

#### `manage_page_labels`
**Purpose**: Add or remove labels on Confluence pages  
**Usage**: `Add label [LABEL] to page [PAGE_ID]`

**Parameters**:
- `pageId` (string) - Target page ID
- `labels` (array) - Labels to add/remove
- `action` (string) - "add" or "remove"

**Example**:
```
Add labels "api" and "documentation" to page 123456789
```

### Template Tools

#### `list_available_templates`
**Purpose**: List all available YAML templates  
**Usage**: `Show me available templates`

**Parameters**:
- `category` (string, optional) - Filter by template category

**Examples**:
```
Show me all available templates
```
```
Show templates in the "user-guide" category
```

#### `generate_from_template`
**Purpose**: Generate structured content from YAML template  
**Usage**: `Generate documentation using [TEMPLATE_NAME] template`

**Parameters**:
- `templateName` (string) - Name of template to use
- `outputPath` (string, optional) - Custom output path
- `userContext` (object, optional) - Template variables

**Example**:
```
Generate getting started guide using "simple-getting-started" template for my React app
```

#### `validate_template`
**Purpose**: Validate YAML template structure  
**Usage**: `Validate template file [TEMPLATE_PATH]`

**Parameters**:
- `templatePath` (string) - Path to template file

**Example**:
```
Validate my custom template file templates/my-template.yml
```

## How to Use Tools with Claude

### Natural Language Commands

Claude understands natural language requests and automatically selects appropriate tools:

#### Authentication Commands
```
"Set up authentication with Confluence"
→ Uses: confluence_oauth_init

"Check if I'm logged into Confluence" 
→ Uses: confluence_oauth_status

"Reset my Confluence login"
→ Uses: confluence_oauth_clear
```

#### Content Management Commands
```
"Download the team handbook page for editing"
→ Uses: confluence_download_page

"Upload my updated documentation to Confluence"
→ Uses: confluence_upload_page

"Create a new troubleshooting guide in the SUPPORT space"
→ Uses: create_confluence_content
```

#### Search Commands
```
"Find all pages about API documentation"
→ Uses: search_confluence_pages

"Show me all available spaces"
→ Uses: list_confluence_spaces

"What's the version history of the main documentation page?"
→ Uses: get_page_versions
```

#### Template Commands
```
"Show me available documentation templates"
→ Uses: list_available_templates

"Create API documentation using the standard template"
→ Uses: generate_from_template
```

### Workflow Examples

#### Complete Page Editing Workflow
```
User: "I need to update the API documentation page"

Claude: 
1. "What's the page ID of the API documentation?"
2. Uses confluence_download_page to download the page
3. "I've downloaded the page to confluence-downloads/. Make your edits."
4. Uses confluence_upload_page to upload changes back
```

#### New Documentation Creation Workflow
```
User: "Create comprehensive API documentation"

Claude:
1. Uses list_available_templates to show options
2. "I found an 'api-documentation' template. What's your API name and base URL?"
3. Uses generate_from_template with user context
4. Uses create_confluence_content to create the page
```

#### Content Discovery Workflow
```
User: "Find outdated documentation that needs updating"

Claude:
1. Uses search_confluence_pages with date filters
2. Uses get_page_versions to check update history
3. Provides list of pages that need attention
```

## Tool Discovery Tips

### 1. Start with Questions
```
"What can you help me do with Confluence?"
"How do I download a page for editing?"
"What templates are available?"
```

### 2. Be Specific About Goals
```
"I want to create API documentation" (Claude suggests templates)
"I need to update multiple pages" (Claude suggests batch workflows)
"I'm looking for specific content" (Claude suggests search tools)
```

### 3. Ask for Tool Details
```
"What parameters does the download tool need?"
"How do I use CQL for searching?"
"What template variables are available?"
```

### 4. Request Workflows
```
"Walk me through editing a page"
"Show me how to create documentation from scratch" 
"What's the process for bulk updates?"
```

## Advanced Usage

### CQL (Confluence Query Language)
Use with `search_confluence_pages` for powerful searches:

```
# Find pages by title
title ~ "API"

# Find recent content
created >= "2024-01-01"

# Find by space and content
space = "DOCS" and text ~ "authentication"

# Find by labels
label in ("api", "documentation")

# Find by contributor
contributor = "john.doe@company.com"
```

### Template Variables
When using templates, provide context:

```
"Generate documentation using api-template with:
- project_name: Payment Gateway
- api_version: v2.1
- base_url: https://api.payments.com"
```

### Batch Operations
For multiple pages:

```
"Download all pages in DOCS space that contain 'outdated'"
"Update all API documentation pages with new authentication section"
```

## Troubleshooting Tool Usage

### Common Issues

1. **Authentication Required**
   ```
   Error: "OAuth authentication required"
   Solution: Run confluence_oauth_init first
   ```

2. **Page Not Found**
   ```
   Error: "Page ID 123456789 not found"
   Solution: Verify page ID from Confluence URL
   ```

3. **Template Not Found**
   ```
   Error: "Template 'my-template' not found"
   Solution: Use list_available_templates to see options
   ```

4. **Permission Denied**
   ```
   Error: "Insufficient permissions for space DOCS"
   Solution: Check space permissions in Confluence
   ```

### Getting Help

Ask Claude for specific help:

```
"I'm getting an authentication error with Confluence"
"The download tool isn't working for page 123456789"
"How do I fix template generation errors?"
```

Claude can diagnose issues and suggest solutions using the appropriate MCP tools.

## Next Steps

- **[MCP Server Configuration](./mcp-server-configuration.md)** - Server setup and configuration
- **[Confluence Content Tools](./confluence-content-tools.md)** - Detailed tool reference
- **[Claude Template Generation](./claude-template-generation.md)** - Working with templates
- **[Authentication Setup](./authentication-setup.md)** - OAuth configuration guide