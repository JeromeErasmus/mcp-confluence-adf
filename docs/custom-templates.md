# Custom Templates

Complete guide to creating, customizing, and managing YAML templates for automated documentation generation.

## Overview

Custom templates enable you to create standardized documentation structures that can be reused across projects, teams, and organizations. This guide covers everything from basic template creation to advanced customization techniques.

## Template Anatomy

### Basic Template Structure

Every YAML template consists of three main sections:

```yaml
---
# 1. METADATA SECTION
name: "Template Name"
description: "What this template creates"
version: "1.0.0"
category: "template-category"
---

# 2. USER CONTEXT SECTION (Optional)
user_context_required:
  variable_name: "Question to ask user?"

# 3. STRUCTURE SECTION
structure:
  - "# Heading with {{variable_name}}"
  - type: "info_panel"
    title: "Panel Title"
    content_instruction: "What Claude should generate"
```

### Metadata Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `name` | Yes | Template display name | "API Documentation Template" |
| `description` | Yes | Brief description of purpose | "Complete REST API documentation" |
| `version` | Yes | Semantic version | "1.0.0" |
| `category` | Yes | Grouping category | "api-documentation" |
| `sections` | No | Content section tags | `["auth", "endpoints", "examples"]` |
| `output_type` | No | Expected output format | "confluence_page" |
| `author` | No | Template creator | "Team Name" |
| `created` | No | Creation date | "2024-01-15" |
| `updated` | No | Last update date | "2024-01-20" |

### User Context Variables

Define variables that users must provide when using the template:

```yaml
user_context_required:
  service_name: "What is the name of your service?"
  api_version: "What API version are you documenting?"
  base_url: "What is the API base URL?"
  auth_method: "What authentication method is used? (API Key, OAuth, Basic Auth)"
  contact_email: "Who should users contact for support?"
```

**Best Practices:**
- Use clear, specific questions
- Provide examples in questions when helpful
- Keep required context minimal
- Group related variables logically

## Structure Elements

### Text Elements

#### Direct Markdown
```yaml
structure:
  - "# Main Heading"
  - "## Sub Heading"
  - "Regular paragraph text with {{variable}} substitution"
  - ""  # Empty line
  - "Another paragraph"
```

#### Variable Substitution
```yaml
structure:
  - "# Getting Started with {{service_name}}"
  - "Base URL: `{{base_url}}`"
  - "Version: {{api_version}}"
```

### Panel Elements

#### Info Panel
```yaml
structure:
  - type: "info_panel"
    title: "Important Information"
    content_instruction: "Explain the key benefits of {{service_name}}"
    purpose: "Help users understand value proposition"
```

#### Warning Panel
```yaml
structure:
  - type: "warning_panel"
    title: "Security Notice"
    content_instruction: "Document security considerations for {{auth_method}}"
    purpose: "Ensure secure implementation"
```

#### Success Panel
```yaml
structure:
  - type: "success_panel"
    title: "You're Ready!"
    content_instruction: "Congratulate users and suggest next steps"
    purpose: "Provide positive closure and guidance"
```

#### Note Panel
```yaml
structure:
  - type: "note_panel"
    title: "Additional Context"
    content_instruction: "Provide helpful tips for {{service_name}}"
    purpose: "Share best practices and insights"
```

### Code Block Elements

#### Basic Code Block
```yaml
structure:
  - type: "code_block"
    language: "bash"
    title: "Installation Command"
    content_instruction: "Provide installation command for {{service_name}}"
    purpose: "Help users install the service quickly"
```

#### Multi-language Code Block
```yaml
structure:
  - type: "code_block"
    language: "javascript"
    title: "JavaScript Example"
    content_instruction: "Show how to call {{service_name}} API in JavaScript"
  - type: "code_block"
    language: "python"
    title: "Python Example"  
    content_instruction: "Show how to call {{service_name}} API in Python"
```

### Expandable Elements

```yaml
structure:
  - type: "expandable"
    title: "Advanced Configuration"
    content_instruction: "Document advanced configuration options for {{service_name}}"
    purpose: "Provide detailed information without cluttering main content"
    content:
      - "### Configuration Options"
      - type: "code_block"
        language: "json"
        content_instruction: "Show configuration file example"
```

### Table Elements

```yaml
structure:
  - type: "table"
    title: "API Endpoints"
    headers: ["Method", "Endpoint", "Description"]
    content_instruction: "Generate table of main API endpoints for {{service_name}}"
    purpose: "Provide quick reference for developers"
```

## Creating Your First Template

### Step 1: Plan Your Template

Before writing YAML, plan your template:

1. **Identify the Documentation Type**
   - API documentation
   - User guide
   - Troubleshooting guide
   - Installation instructions
   - Security documentation

2. **Define Required Information**
   - What varies between uses?
   - What context is needed?
   - What stays consistent?

3. **Outline the Structure**
   - What sections are needed?
   - What order makes sense?
   - What content types work best?

### Step 2: Create the YAML File

Create a new file in `templates/yaml/` directory:

```bash
# Create template file
touch templates/yaml/my-custom-template.yml
```

### Step 3: Write the Template

Start with a basic structure:

```yaml
---
name: "My Custom Template"
description: "Template for creating custom documentation"
version: "1.0.0"
category: "custom"
sections: ["introduction", "setup", "usage"]
author: "Your Name"
created: "2024-01-15"
---

user_context_required:
  project_name: "What is your project name?"
  technology: "What technology stack are you using?"

structure:
  - "# {{project_name}} Documentation"
  
  - type: "info_panel"
    title: "Overview"
    content_instruction: "Provide a brief overview of {{project_name}} and its purpose"
    purpose: "Help users understand what this project does"
  
  - "## Getting Started"
  
  - type: "code_block"
    language: "bash"
    title: "Installation"
    content_instruction: "Provide installation instructions for {{project_name}} using {{technology}}"
    purpose: "Help users install the project"
  
  - "## Basic Usage"
  
  - "Detailed usage instructions will go here."
  
  - type: "success_panel"
    title: "Next Steps"
    content_instruction: "Suggest what users should do after getting started with {{project_name}}"
    purpose: "Guide users toward advanced usage"
```

### Step 4: Test Your Template

```bash
# Test with Claude Code
Generate documentation using my custom template for "Payment Service" project using "Node.js"
```

## Advanced Template Features

### Conditional Content

Create content that appears only under certain conditions:

```yaml
structure:
  - "# {{service_name}} API Documentation"
  
  - type: "conditional"
    condition: "{{auth_method}} == 'OAuth'"
    content:
      - type: "warning_panel"
        title: "OAuth Setup Required"
        content_instruction: "Explain OAuth setup process for {{service_name}}"
  
  - type: "conditional"
    condition: "{{auth_method}} == 'API Key'"
    content:
      - type: "info_panel"
        title: "API Key Authentication"
        content_instruction: "Explain API key usage for {{service_name}}"
```

### Repeated Sections

Generate multiple similar sections based on user input:

```yaml
user_context_required:
  service_name: "Service name?"
  endpoints: "List main endpoints (comma-separated)?"

structure:
  - "# {{service_name}} API Reference"
  
  - type: "repeated_section"
    source: "{{endpoints}}"
    separator: ","
    template:
      - "## {{item}} Endpoint"
      - type: "code_block"
        language: "http"
        content_instruction: "Show HTTP request example for {{item}} endpoint"
      - type: "code_block"
        language: "json"
        content_instruction: "Show response example for {{item}} endpoint"
```

### Template Inheritance

Create base templates that can be extended:

```yaml
# base-api-template.yml
---
name: "Base API Template"
type: "base"
category: "api-documentation"
---

base_structure:
  - "# {{service_name}} API"
  - type: "info_panel"
    title: "Overview"
    content_instruction: "API overview for {{service_name}}"
  - "## Authentication"
  - type: "auth_section_placeholder"
  - "## Endpoints"
  - type: "endpoints_placeholder"
  - "## Examples"
  - type: "examples_placeholder"
```

```yaml
# rest-api-template.yml
---
name: "REST API Template"
extends: "base-api-template"
category: "api-documentation"
---

structure:
  - type: "inherit_base"
  - type: "override"
    placeholder: "auth_section_placeholder"
    content:
      - type: "code_block"
        language: "bash"
        content_instruction: "Show REST API authentication example"
  - type: "override"
    placeholder: "endpoints_placeholder"
    content:
      - type: "table"
        headers: ["Method", "Path", "Description"]
        content_instruction: "Generate REST API endpoints table"
```

### Dynamic Content Generation

Templates can include instructions for generating content based on external data:

```yaml
structure:
  - "# {{service_name}} API Documentation"
  
  - type: "dynamic_content"
    source: "openapi_spec"
    instruction: "Parse OpenAPI specification and generate endpoint documentation"
    format: "rest_api_endpoints"
  
  - type: "dynamic_content"
    source: "git_repository"
    instruction: "Extract README.md content and summarize project setup"
    format: "installation_guide"
```

## Template Categories and Organization

### Standard Categories

Use these standard categories for consistency:

- **api-documentation**: REST APIs, GraphQL APIs, SDK documentation
- **user-guides**: End-user documentation, tutorials, how-to guides
- **technical-specs**: Architecture documents, design specifications
- **installation**: Setup guides, deployment instructions
- **troubleshooting**: Problem-solving guides, FAQ documents
- **security**: Security guides, best practices, compliance docs
- **reference**: Code references, configuration options

### Custom Categories

Create custom categories for your organization:

```yaml
category: "company-internal"
# or
category: "mobile-app-docs"
# or  
category: "compliance-templates"
```

### Template Naming Conventions

Use descriptive, consistent names:

**Good:**
- `rest-api-documentation-v2.yml`
- `mobile-app-user-guide.yml`
- `security-audit-template.yml`

**Avoid:**
- `template1.yml`
- `docs.yml`
- `my-template.yml`

## Content Instruction Best Practices

### Writing Effective Instructions

**Good Instructions:**
```yaml
content_instruction: "Explain how to authenticate with {{service_name}} using {{auth_method}}, including code examples and error handling"
purpose: "Help developers integrate authentication correctly"
```

**Poor Instructions:**
```yaml
content_instruction: "Write about authentication"
```

### Instruction Components

Include these elements in your instructions:

1. **What to Generate**: Specific content type
2. **Context**: Use template variables
3. **Format**: Code examples, step-by-step, bullet points
4. **Audience**: Who will read this content
5. **Purpose**: Why this content matters

### Example Patterns

#### Step-by-Step Instructions
```yaml
content_instruction: "Provide step-by-step installation instructions for {{service_name}} on {{platform}}, including prerequisites, installation command, and verification steps"
```

#### Code Examples
```yaml
content_instruction: "Show a complete code example of making a {{http_method}} request to {{service_name}} {{endpoint_name}} endpoint, including headers, request body, and response handling"
```

#### Best Practices
```yaml
content_instruction: "List 5-7 best practices for using {{service_name}} securely in production, with brief explanations of why each practice is important"
```

#### Troubleshooting
```yaml
content_instruction: "Document the 3 most common issues users encounter with {{service_name}} {{feature_name}}, including symptoms, causes, and solutions"
```

## Template Validation and Testing

### YAML Syntax Validation

Always validate YAML syntax before using templates:

```bash
# Using yq (if installed)
yq eval templates/yaml/my-template.yml

# Using Python
python -c "import yaml; yaml.safe_load(open('templates/yaml/my-template.yml'))"

# Using Node.js
node -e "console.log(require('js-yaml').load(require('fs').readFileSync('templates/yaml/my-template.yml', 'utf8')))"
```

### Template Structure Validation

Check for required fields and proper structure:

```yaml
# Validation checklist:
# ✓ Required metadata fields present
# ✓ User context variables have clear questions
# ✓ Structure elements use supported types
# ✓ Content instructions are specific and actionable
# ✓ Variable references use consistent naming
```

### Testing Templates

Test templates with different user contexts:

```bash
# Test with minimal context
Generate docs using "my-custom-template" for project "TestApp" with "React"

# Test with complex context  
Generate docs using "my-custom-template" for project "Enterprise API" with "Node.js, Express, PostgreSQL"

# Test edge cases
Generate docs using "my-custom-template" for project "A" with "B"
```

## Template Management

### Version Control

Track template changes with semantic versioning:

```yaml
version: "1.0.0"  # Initial version
version: "1.1.0"  # New features added
version: "1.0.1"  # Bug fixes
version: "2.0.0"  # Breaking changes
```

### Template Documentation

Document your templates with README files:

```markdown
# Custom Template Collection

## Templates

### API Documentation Template
- **File**: `rest-api-documentation.yml`
- **Purpose**: Complete REST API documentation
- **Context Required**: service_name, base_url, auth_method
- **Sections**: Overview, Authentication, Endpoints, Examples

### User Guide Template  
- **File**: `user-guide-basic.yml`
- **Purpose**: End-user documentation
- **Context Required**: product_name, platform
- **Sections**: Getting Started, Features, Troubleshooting
```

### Template Sharing

Share templates across teams:

```bash
# Export template collection
tar -czf company-templates.tar.gz templates/yaml/

# Import to new environment
tar -xzf company-templates.tar.gz
```

## Integration with Development Workflows

### CI/CD Integration

Automate documentation generation:

```yaml
# .github/workflows/docs.yml
name: Generate Documentation
on:
  push:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Generate API docs
        run: |
          # Use template to generate docs
          # Upload to Confluence
```

### IDE Integration

Create snippets for common template patterns:

```json
// VS Code snippet
{
  "Confluence Template": {
    "prefix": "confluence-template",
    "body": [
      "---",
      "name: \"$1\"",
      "description: \"$2\"", 
      "version: \"1.0.0\"",
      "category: \"$3\"",
      "---",
      "",
      "user_context_required:",
      "  $4: \"$5\"",
      "",
      "structure:",
      "  - \"# $6\"",
      "  - type: \"info_panel\"",
      "    title: \"$7\"",
      "    content_instruction: \"$8\""
    ]
  }
}
```

## Troubleshooting Templates

### Common Issues

#### YAML Parsing Errors
```
Error: Invalid YAML syntax at line 15
```
**Solution**: Validate YAML syntax, check indentation

#### Missing Context Variables
```
Error: Variable 'service_name' not found
```
**Solution**: Ensure all {{variables}} are defined in user_context_required

#### Invalid Structure Types
```
Error: Unknown structure type 'custom_panel'
```
**Solution**: Use supported structure types (info_panel, code_block, etc.)

#### Content Generation Failures
```
Warning: Could not generate content for instruction
```
**Solution**: Make instructions more specific and actionable

### Debug Mode

Enable debug output when testing templates:

```bash
DEBUG=template:* npx mcp-confluence-adf
```

## Advanced Examples

### Complete API Documentation Template

```yaml
---
name: "Complete REST API Documentation"
description: "Comprehensive REST API documentation with authentication, endpoints, and examples"
version: "2.1.0"
category: "api-documentation"
sections: ["overview", "authentication", "endpoints", "examples", "errors"]
author: "API Documentation Team"
created: "2024-01-15"
updated: "2024-01-20"
---

user_context_required:
  service_name: "What is the name of your API service?"
  base_url: "What is the API base URL? (e.g., https://api.company.com/v1)"
  auth_method: "What authentication method is used? (API Key, OAuth 2.0, Basic Auth)"
  version: "What API version are you documenting? (e.g., 1.0)"
  contact_email: "Who should developers contact for API support?"
  rate_limit: "What are the rate limits? (e.g., 1000 requests per hour)"

structure:
  - "# {{service_name}} API Documentation"
  - "Version {{version}}"
  - ""
  
  - type: "info_panel"
    title: "API Overview"
    content_instruction: "Provide a comprehensive overview of {{service_name}}, explaining its purpose, key features, and what developers can accomplish with it"
    purpose: "Help developers understand the API's value and capabilities"
  
  - "## Base URL"
  - "`{{base_url}}`"
  - ""
  
  - "## Authentication"
  - type: "warning_panel"
    title: "Authentication Required"
    content_instruction: "Explain how {{auth_method}} authentication works for {{service_name}}, including how to obtain credentials and where to include them in requests"
    purpose: "Ensure developers can authenticate properly"
  
  - type: "code_block"
    language: "bash"
    title: "Authentication Example"
    content_instruction: "Show a complete curl example demonstrating {{auth_method}} authentication with {{service_name}}"
    purpose: "Provide practical authentication example"
  
  - "## Rate Limiting"
  - "This API has rate limiting in place:"
  - "- Limit: {{rate_limit}}"
  - "- Rate limit headers are included in all responses"
  - ""
  
  - type: "expandable"
    title: "Rate Limit Headers"
    content_instruction: "Document the rate limit headers returned by {{service_name}} API and what each header means"
    purpose: "Help developers handle rate limiting properly"
  
  - "## Endpoints"
  - type: "table"
    title: "Available Endpoints"
    headers: ["Method", "Endpoint", "Description", "Auth Required"]
    content_instruction: "Generate a comprehensive table of all major endpoints for {{service_name}}, including HTTP methods, paths, brief descriptions, and authentication requirements"
    purpose: "Provide quick reference for all available endpoints"
  
  - "### Example Requests and Responses"
  
  - type: "expandable"
    title: "GET Request Example"
    content:
      - type: "code_block"
        language: "bash"
        title: "Request"
        content_instruction: "Show a complete curl GET request example for the most commonly used {{service_name}} endpoint"
      - type: "code_block"
        language: "json"
        title: "Response"
        content_instruction: "Show the JSON response for the GET request example above"
  
  - type: "expandable"
    title: "POST Request Example"
    content:
      - type: "code_block"
        language: "bash"
        title: "Request"
        content_instruction: "Show a complete curl POST request example for creating a resource in {{service_name}}"
      - type: "code_block"
        language: "json"
        title: "Response"
        content_instruction: "Show the JSON response for the POST request example above"
  
  - "## Error Handling"
  
  - type: "warning_panel"
    title: "Error Response Format"
    content_instruction: "Document the standard error response format used by {{service_name}}, including status codes, error messages, and any error details"
    purpose: "Help developers handle errors appropriately"
  
  - type: "table"
    title: "Common Error Codes"
    headers: ["Status Code", "Error", "Description", "Solution"]
    content_instruction: "Generate a table of the most common error codes returned by {{service_name}}, with descriptions and suggested solutions"
    purpose: "Help developers troubleshoot common issues"
  
  - "## SDKs and Libraries"
  
  - type: "code_block"
    language: "javascript"
    title: "JavaScript/Node.js"
    content_instruction: "Show how to make requests to {{service_name}} using JavaScript/Node.js, including installation and basic usage"
  
  - type: "code_block"
    language: "python"
    title: "Python"
    content_instruction: "Show how to make requests to {{service_name}} using Python, including installation and basic usage"
  
  - type: "code_block"
    language: "go"
    title: "Go"
    content_instruction: "Show how to make requests to {{service_name}} using Go, including basic HTTP client usage"
  
  - "## Support"
  
  - type: "success_panel"
    title: "Get Help"
    content_instruction: "Provide information about how developers can get help with {{service_name}}, including support channels, documentation links, and contact information ({{contact_email}})"
    purpose: "Ensure developers know how to get help when needed"
  
  - "## Changelog"
  - "- Version {{version}}: Current documentation"
  - type: "note_panel"
    title: "Stay Updated"
    content_instruction: "Explain how developers can stay informed about {{service_name}} API changes, updates, and new features"
    purpose: "Keep developers informed about API evolution"
```

## Next Steps

- **[Template System](./template-system.md)** - Understanding the complete template architecture
- **[Claude Template Generation](./claude-template-generation.md)** - Using templates with Claude
- **[Template Process Flow](./template-process-flow.md)** - Technical implementation details
- **[MCP Tools Reference](./mcp-tools-reference.md)** - Template-related MCP tools