# Claude Code Integration

Complete guide to integrating the MCP Confluence ADF server with Claude Code for seamless documentation workflows.

## Overview

Claude Code provides a powerful environment for working with Confluence content through natural language commands. The MCP Confluence ADF server exposes all functionality through conversational interfaces.

## Installation & Setup

### Step 1: Install MCP Server

```bash
# Install globally via npm/yarn
yarn global add mcp-confluence-adf

# Or use npx for testing
npx mcp-confluence-adf --help
```

### Step 2: Configure Claude Code

#### Option A: Automatic Configuration (Recommended)
```bash
claude mcp add --scope user mcp-confluence-adf npx mcp-confluence-adf
```

#### Option B: Manual Configuration
Edit `~/.config/claude/settings.json`:

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

### Step 3: Restart Claude Code

Close and reopen Claude Code to load the MCP server.

### Step 4: Verify Installation

In Claude Code, ask:
```
What Confluence tools do you have available?
```

You should see the full list of MCP tools loaded.

## Natural Language Workflows

### Authentication Workflows

#### First-Time Setup
```
User: "Set up authentication with my Confluence instance"

Claude: 
1. "I'll help you set up OAuth authentication. Do you have your Atlassian OAuth credentials?"
2. Walks through oauth_init process
3. Opens browser for authorization
4. Confirms successful authentication
```

#### Check Authentication Status
```
User: "Am I logged into Confluence?"

Claude: Uses confluence_oauth_status and reports current connection state
```

#### Reset Authentication
```
User: "I need to reset my Confluence login"

Claude: Uses confluence_oauth_clear and guides through re-authentication
```

### Content Management Workflows

#### Download and Edit Workflow
```
User: "I need to update the team onboarding guide"

Claude:
1. "What's the page ID or can you share the Confluence URL?"
2. Uses confluence_download_page to get the content
3. "I've saved it to confluence-downloads/[id]-team-onboarding-guide.md"
4. "Make your edits and let me know when you're ready to upload"

User: "I'm done editing"

Claude:
1. Uses confluence_upload_page to update the page
2. "Successfully updated! The page is live on Confluence."
```

#### Create New Documentation
```
User: "Create comprehensive API documentation for our payment service"

Claude:
1. "I'll use our API documentation template. What's the service name and base URL?"
2. Uses list_available_templates and generate_from_template
3. Generates structured content with proper sections
4. Uses create_confluence_content to create the page
5. "Created new API documentation in your DOCS space!"
```

#### Bulk Content Operations
```
User: "Update all our API documentation with new authentication requirements"

Claude:
1. Uses search_confluence_pages to find API docs
2. Downloads multiple pages
3. Applies updates to authentication sections
4. Uploads updated pages back to Confluence
```

### Template-Driven Workflows

#### Template Discovery
```
User: "What documentation templates are available?"

Claude:
1. Uses list_available_templates
2. Shows organized list by category
3. Explains each template's purpose and use cases
```

#### Template-Based Creation
```
User: "Create a troubleshooting guide for our mobile app"

Claude:
1. "I'll use the troubleshooting template. What's your app name and main issues users face?"
2. Uses generate_from_template with user context
3. Creates structured troubleshooting guide
4. Uploads to specified Confluence space
```

#### Custom Template Development
```
User: "Help me create a custom template for our security documentation"

Claude:
1. Explains YAML template structure
2. Helps define sections and content instructions
3. Creates template file in templates/yaml/
4. Tests template generation
5. Validates template structure
```

### Search and Discovery Workflows

#### Content Discovery
```
User: "Find all documentation that mentions 'authentication'"

Claude:
1. Uses search_confluence_pages with appropriate CQL
2. Returns organized results with summaries
3. Offers to download specific pages for editing
```

#### Advanced Search
```
User: "Find pages in DOCS space modified by john.doe in the last month"

Claude:
1. Constructs CQL query: space = "DOCS" AND contributor = "john.doe" AND lastModified >= "-30d"
2. Uses search_confluence_pages
3. Presents results with modification dates and summaries
```

#### Space Exploration
```
User: "Show me all my Confluence spaces and their recent activity"

Claude:
1. Uses list_confluence_spaces
2. For each space, uses search to find recent changes
3. Presents organized overview of space activity
```

## Advanced Integration Patterns

### Automated Documentation Pipelines

#### API Documentation Pipeline
```
User: "Set up automated API documentation updates"

Claude:
1. Creates template for API endpoints
2. Sets up workflow to:
   - Parse API specifications
   - Generate endpoint documentation
   - Update Confluence pages
   - Notify team of changes
```

#### Code Documentation Integration
```
User: "Keep our code documentation in sync with Confluence"

Claude:
1. Creates workflow to:
   - Extract code comments and README content
   - Apply documentation templates
   - Update corresponding Confluence pages
   - Track changes and versions
```

### Content Quality Workflows

#### Documentation Review Process
```
User: "Help me review all our documentation for completeness"

Claude:
1. Uses search to find all documentation pages
2. Downloads content for analysis
3. Checks against documentation standards
4. Identifies gaps and outdated content
5. Creates action plan for improvements
```

#### Style Guide Enforcement
```
User: "Ensure all our docs follow the company style guide"

Claude:
1. Downloads documentation for analysis
2. Checks formatting, structure, and content patterns
3. Applies style guide corrections
4. Updates pages with consistent formatting
```

### Migration and Backup Workflows

#### Content Migration
```
User: "Migrate our documentation from old Confluence to new instance"

Claude:
1. Downloads all content from source
2. Organizes by space and hierarchy
3. Recreates structure in target instance
4. Uploads content with preserved formatting
5. Validates migration completeness
```

#### Backup and Archival
```
User: "Create local backups of our critical documentation"

Claude:
1. Identifies critical documentation spaces
2. Downloads all content as Markdown files
3. Organizes in logical directory structure
4. Creates metadata for restoration
5. Sets up periodic backup routine
```

## Custom Workflow Development

### Creating Reusable Workflows

#### Workflow Definition
```yaml
# Example workflow definition
name: API Documentation Update
trigger: manual | scheduled | webhook
steps:
  - search_confluence_pages: 
      cql: "space = API AND label = 'endpoints'"
  - download_pages: 
      pages: "${search_results}"
  - apply_template:
      template: "api-endpoint-update"
      context: "${api_spec_changes}"
  - upload_pages:
      mode: "update"
      notify: true
```

#### Workflow Execution
```
User: "Run the API documentation update workflow"

Claude: 
1. Executes defined workflow steps
2. Provides progress updates
3. Handles errors and retries
4. Reports completion status
```

### Integration with External Systems

#### Git Integration
```
User: "Sync Confluence documentation with our Git repository"

Claude:
1. Downloads Confluence content
2. Commits to Git repository
3. Tracks changes and versions
4. Handles merge conflicts
5. Updates Confluence from Git changes
```

#### Slack Integration
```
User: "Notify the team when documentation is updated"

Claude:
1. Monitors documentation changes
2. Formats update summaries
3. Sends notifications to appropriate Slack channels
4. Includes links to changed pages
```

## Performance and Optimization

### Efficient Content Operations

#### Batch Processing
- **Multiple downloads**: Process pages in parallel
- **Bulk uploads**: Update multiple pages efficiently
- **Rate limit handling**: Automatic throttling and retry
- **Progress tracking**: Real-time status updates

#### Caching Strategy
- **Template caching**: Avoid re-parsing YAML templates
- **Content caching**: Store frequently accessed content
- **Search result caching**: Cache expensive CQL queries
- **Token caching**: Minimize authentication requests

### Error Handling and Recovery

#### Automatic Recovery
```
User: "Upload failed for some pages, what happened?"

Claude:
1. Analyzes error logs
2. Identifies specific failure reasons
3. Retries failed operations with backoff
4. Reports successful recoveries
5. Escalates persistent failures
```

#### Validation and Verification
```
User: "Verify all our documentation uploads completed correctly"

Claude:
1. Compares local and remote content
2. Validates formatting and structure
3. Reports discrepancies
4. Suggests corrective actions
```

## Monitoring and Maintenance

### Health Monitoring

#### System Health Checks
```
User: "Check the health of our Confluence integration"

Claude:
1. Tests authentication status
2. Validates API connectivity
3. Checks rate limit status
4. Verifies template availability
5. Reports overall system health
```

#### Performance Monitoring
```
User: "How is our documentation system performing?"

Claude:
1. Analyzes operation response times
2. Reports error rates and patterns
3. Identifies performance bottlenecks
4. Suggests optimization opportunities
```

### Maintenance Tasks

#### Regular Maintenance
```
User: "Perform routine maintenance on our documentation system"

Claude:
1. Cleans up temporary files
2. Validates template integrity
3. Updates cached content
4. Optimizes local storage
5. Reports maintenance completion
```

#### Updates and Upgrades
```
User: "Update the MCP Confluence server to the latest version"

Claude:
1. Checks current version
2. Downloads and installs updates
3. Tests functionality post-update
4. Reports version change and new features
```

## Best Practices

### Workflow Organization
- **Consistent naming**: Use clear, descriptive names for templates and workflows
- **Logical grouping**: Organize content by team, project, or function
- **Version control**: Track changes to templates and configurations
- **Documentation**: Document custom workflows and integrations

### Security Considerations
- **Credential management**: Secure storage of OAuth tokens
- **Access control**: Appropriate Confluence permissions
- **Audit logging**: Track all content modifications
- **Regular reviews**: Periodic security and access audits

### Performance Guidelines
- **Batch operations**: Group multiple operations when possible
- **Rate limit awareness**: Design workflows within API limits
- **Error resilience**: Handle failures gracefully with retries
- **Progress visibility**: Provide feedback for long-running operations

## Troubleshooting

### Common Integration Issues

#### MCP Server Not Loading
```
Error: "MCP server mcp-confluence-adf not found"
Solution: 
1. Verify installation: npx mcp-confluence-adf --help
2. Check Claude Code configuration
3. Restart Claude Code
```

#### Authentication Failures
```
Error: "OAuth authentication required"
Solution:
1. Check authentication status
2. Re-run OAuth setup if needed
3. Verify token storage permissions
```

#### Template Generation Errors
```
Error: "Template 'custom-template' not found"
Solution:
1. List available templates
2. Check template file location and format
3. Validate YAML syntax
```

### Getting Help

#### Built-in Help
```
"How do I use the confluence_download_page tool?"
"What parameters does create_confluence_content need?"
"Show me examples of CQL queries"
```

#### Community Support
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides and examples
- **Community Forum**: Share workflows and get help

## Next Steps

- **[Authentication Setup](./authentication-setup.md)** - Complete OAuth configuration
- **[MCP Tool Discovery](./mcp-tool-discovery.md)** - Explore all available tools
- **[Template System](./template-system.md)** - Advanced template usage
- **[Batch Operations](./batch-operations.md)** - Efficient bulk processing