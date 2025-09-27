# Confluence Content Tools

Complete reference for all MCP tools available for Confluence content management.

## Content Reading Tools

### `get_confluence_page`

Retrieve a specific Confluence page with full content.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `pageId` (string): Unique page identifier

**Example:**
```
Get the content of page ID 123456789 from Confluence
```

**Returns:**
- Page content converted to Markdown
- Page metadata (title, version, author, etc.)
- Links and attachments

### `get_confluence_spaces`

List all accessible Confluence spaces.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `limit` (number, optional): Maximum number of spaces to return
- `type` (string, optional): Filter by space type

**Example:**
```
List all my Confluence spaces
```

**Returns:**
- Space metadata (name, key, type)
- Access permissions
- Space description and icon

### `get_pages_in_confluence_space`

Get all pages within a specific Confluence space.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `spaceId` (string): Numerical space identifier
- `limit` (number, optional): Maximum pages to return
- `status` (string, optional): Filter by page status

**Example:**
```
Show me all pages in the DOCS space
```

**Returns:**
- List of pages with metadata
- Page hierarchy information
- Content summaries

### `search_confluence_using_cql`

Search Confluence content using CQL (Confluence Query Language).

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `cql` (string): CQL query expression
- `limit` (number, optional): Maximum results to return

**Example:**
```
Search for pages containing "API documentation" in the last month
```

**CQL Examples:**
```
title ~ "API" AND type = page AND space = DOCS
text ~ "documentation" AND created >= "-30d"
label = "technical" AND contributor = "john.doe"
```

## Content Creation Tools

### `create_confluence_page`

Create a new Confluence page.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `spaceId` (string): Target space ID
- `title` (string): Page title
- `body` (string): Page content in Markdown format
- `parentId` (string, optional): Parent page ID for hierarchy
- `isPrivate` (boolean, optional): Create as private page

**Example:**
```
Create a new page called "API Documentation" in space DOCS with content:

# API Documentation
This page contains our API documentation.

## Getting Started
...
```

**Features:**
- Automatic Markdown to ADF conversion
- Support for rich content (panels, tables, etc.)
- Hierarchical page structure
- Private page creation

### `create_confluence_live_doc`

Create a new Confluence Live Document.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `spaceId` (string): Target space ID
- `title` (string): Live doc title
- `body` (string): Content in Markdown format
- `subtype` (string): Set to "live" for live documents

**Example:**
```
Create a live document called "Team Meeting Notes" for collaborative editing
```

## Content Update Tools

### `update_confluence_page`

Update an existing Confluence page.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `pageId` (string): Page to update
- `body` (string): New content in Markdown format
- `title` (string, optional): New page title
- `versionMessage` (string, optional): Update description

**Example:**
```
Update page 123456789 with new content:

# Updated Documentation
This page has been revised with the latest information.
```

**Features:**
- Preserves page version history
- Maintains page hierarchy
- Automatic conflict resolution
- Rich content preservation

## Comment Tools

### `create_confluence_footer_comment`

Add a comment to the bottom of a Confluence page.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `pageId` (string): Target page ID
- `body` (string): Comment content in Markdown
- `parentCommentId` (string, optional): Reply to existing comment

**Example:**
```
Add a comment to page 123456789: "This documentation needs updating"
```

### `create_confluence_inline_comment`

Create an inline comment attached to specific text.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `pageId` (string): Target page ID
- `body` (string): Comment content
- `inlineCommentProperties` (object): Text selection details

**Example:**
```
Add inline comment to the text "deprecated API" on page 123456789
```

### `get_confluence_page_comments`

Retrieve comments from a Confluence page.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `pageId` (string): Target page ID
- `commentType` (string): "footer" or "inline"

**Example:**
```
Get all comments from page 123456789
```

## Content Discovery Tools

### `get_confluence_page_descendants`

Get all child pages of a specific page.

**Parameters:**
- `cloudId` (string): Confluence cloud ID or site URL
- `pageId` (string): Parent page ID
- `depth` (number, optional): Maximum depth to traverse

**Example:**
```
Show me all child pages under the main documentation page
```

### `search_confluence`

General search across Confluence content.

**Parameters:**
- `query` (string): Search terms
- `cloudId` (string, optional): Specific Confluence instance
- `limit` (number, optional): Maximum results

**Example:**
```
Search for "user guide" across all accessible Confluence content
```

## Template Tools

### `list_available_templates`

List all available content templates.

**Parameters:**
- `category` (string, optional): Filter by template category

**Example:**
```
Show me all available templates for technical documentation
```

### `generate_from_template`

Generate structured content from a template.

**Parameters:**
- `templateName` (string): Template to use
- `userContext` (object, optional): Variables for template
- `outputPath` (string, optional): Where to save generated content

**Example:**
```
Generate documentation using the "api-documentation" template
```

### `validate_template`

Validate template structure and ADF compatibility.

**Parameters:**
- `templatePath` (string): Path to template file

**Example:**
```
Validate the custom-template.yml template file
```

## Content Conversion Tools

### `markdown_to_adf`

Convert Markdown content to ADF format.

**Parameters:**
- `markdown` (string): Source Markdown content
- `validateADF` (boolean, optional): Validate output

**Example:**
```
Convert this Markdown to ADF:

# My Document
This is **bold** text with a [link](https://example.com).
```

### `adf_to_markdown`

Convert ADF content back to Markdown.

**Parameters:**
- `adf` (object): ADF document object
- `preserveFormatting` (boolean, optional): Maintain formatting

**Example:**
```
Convert this ADF back to Markdown for editing
```

## Batch Operations

### `bulk_update_pages`

Update multiple pages at once.

**Parameters:**
- `cloudId` (string): Confluence cloud ID
- `updates` (array): List of page updates
- `validateContent` (boolean, optional): Validate before updating

**Example:**
```
Update all pages in the DOCS space with new footer content
```

### `migrate_content`

Migrate content between spaces or instances.

**Parameters:**
- `sourceCloudId` (string): Source Confluence
- `targetCloudId` (string): Target Confluence
- `contentFilter` (object): What to migrate
- `options` (object): Migration options

**Example:**
```
Migrate all documentation pages from the old space to the new space
```

## Usage Examples

### Creating a Complete Documentation Set

```
1. Create main documentation page in DOCS space
2. Generate API documentation using the api-template
3. Create child pages for each API endpoint
4. Add cross-references and navigation
5. Review and publish
```

### Content Maintenance Workflow

```
1. Search for outdated content using CQL
2. Update pages with new information
3. Add comments for reviewers
4. Validate all changes
5. Notify stakeholders
```

## Error Handling

All tools include comprehensive error handling:

- **Authentication errors**: Invalid API tokens
- **Permission errors**: Insufficient access rights
- **Content errors**: Invalid Markdown or ADF
- **Network errors**: Connection issues
- **Validation errors**: Content structure problems

**Common Error Resolution:**
- Check authentication setup
- Verify space and page permissions
- Validate content format
- Review network connectivity
- Check API rate limits

## Next Steps

- **[Template System](./template-system.md)** - Working with content templates
- **[ADF Conversion](./adf-conversion.md)** - Understanding ADF format
- **[Error Handling](./error-handling.md)** - Troubleshooting common issues