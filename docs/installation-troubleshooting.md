# Installation Troubleshooting

Common installation issues and solutions for the MCP Confluence ADF server.

## Overview

This guide covers the most common installation and setup issues you might encounter, along with step-by-step solutions and diagnostic commands.

## Quick Diagnostic Commands

Run these commands to quickly identify your issue:

```bash
# Check if MCP server is installed
npx mcp-confluence-adf --help

# Check Claude Code configuration
cat ~/.config/claude/settings.json | grep -A 10 "mcp-confluence-adf"

# Check if Claude Code can find the server
claude mcp list
```

## Common Installation Issues

### 1. MCP Server Not Found

**Error Messages:**
```
Error: MCP server mcp-confluence-adf not found
Command not found: mcp-confluence-adf
```

**Diagnosis:**
```bash
# Check if globally installed
which mcp-confluence-adf

# Check if npx can find it
npx mcp-confluence-adf --version

# Check global packages
npm list -g mcp-confluence-adf
# or
yarn global list | grep mcp-confluence-adf
```

**Solutions:**

#### Solution A: Install the Package
```bash
# Global installation with yarn
yarn global add mcp-confluence-adf

# Global installation with npm
npm install -g mcp-confluence-adf

# Verify installation
mcp-confluence-adf --version
```

#### Solution B: Use NPX (Recommended)
```bash
# Test with npx
npx mcp-confluence-adf --help

# Update Claude Code configuration to use npx
claude mcp add --scope user mcp-confluence-adf npx mcp-confluence-adf
```

### 2. Claude Code Configuration Issues

**Error Messages:**
```
MCP server failed to start
Invalid MCP configuration
Server process exited with code 1
```

**Diagnosis:**
```bash
# Check Claude Code configuration file
cat ~/.config/claude/settings.json

# Validate JSON syntax
cat ~/.config/claude/settings.json | jq .

# Check if Claude Code is running
ps aux | grep claude
```

**Solutions:**

#### Solution A: Fix Configuration Format
Ensure your configuration follows this exact format:

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

#### Solution B: Regenerate Configuration
```bash
# Remove existing configuration
claude mcp remove mcp-confluence-adf

# Add fresh configuration
claude mcp add --scope user mcp-confluence-adf npx mcp-confluence-adf

# Restart Claude Code
```

#### Solution C: Manual Configuration Fix
Edit `~/.config/claude/settings.json`:

```bash
# Create backup
cp ~/.config/claude/settings.json ~/.config/claude/settings.json.backup

# Edit configuration
code ~/.config/claude/settings.json
```

### 3. Node.js and NPM Issues

**Error Messages:**
```
node: command not found
npm: command not found
Permission denied
```

**Diagnosis:**
```bash
# Check Node.js installation
node --version
npm --version

# Check Node.js path
which node
which npm

# Check permissions
ls -la ~/.npm
```

**Solutions:**

#### Solution A: Install Node.js
```bash
# Install Node.js via package manager (macOS)
brew install node

# Install Node.js via package manager (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Solution B: Fix NPM Permissions
```bash
# Fix NPM global permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Or use a Node version manager (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 4. Python and Build Tool Issues

**Error Messages:**
```
gyp ERR! stack Error: Python executable "python" is not set
node-gyp rebuild failed
```

**Diagnosis:**
```bash
# Check Python installation
python --version
python3 --version

# Check build tools
which gcc
which make
```

**Solutions:**

#### Solution A: Install Python and Build Tools (macOS)
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Python 3
brew install python3
```

#### Solution B: Install Build Tools (Linux)
```bash
# Ubuntu/Debian
sudo apt-get install build-essential python3-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3-devel
```

#### Solution C: Use Pre-built Binaries
```bash
# Force use of pre-built binaries
npm install -g mcp-confluence-adf --prefer-online --no-optional
```

### 5. Permission and Access Issues

**Error Messages:**
```
EACCES: permission denied
Access denied
Cannot create directory
```

**Diagnosis:**
```bash
# Check directory permissions
ls -la ~/.config/
ls -la ~/.npm/

# Check current user
whoami
id

# Check if directories exist
ls -la ~/.config/claude/
```

**Solutions:**

#### Solution A: Fix Directory Permissions
```bash
# Create necessary directories
mkdir -p ~/.config/claude
mkdir -p ~/.npm-global

# Fix permissions
chmod 755 ~/.config/claude
chown $USER:$USER ~/.config/claude
```

#### Solution B: Use User-level Installation
```bash
# Install without sudo
npm config set prefix ~/.npm-global
npm install -g mcp-confluence-adf

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 6. Claude Code Not Loading MCP Server

**Error Messages:**
```
MCP server startup timeout
Failed to connect to MCP server
Server process terminated unexpectedly
```

**Diagnosis:**
```bash
# Test MCP server manually
mcp-confluence-adf
# or
npx mcp-confluence-adf

# Check Claude Code logs
tail -f ~/.config/claude/logs/mcp.log
```

**Solutions:**

#### Solution A: Test Server Independently
```bash
# Run server in debug mode
DEBUG=* npx mcp-confluence-adf

# Check for error messages and dependencies
```

#### Solution B: Restart Claude Code
```bash
# Kill all Claude Code processes
pkill -f claude

# Wait a few seconds, then restart Claude Code
sleep 3
# Open Claude Code application
```

#### Solution C: Check System Resources
```bash
# Check available memory
free -h

# Check CPU usage
top -n 1

# Check disk space
df -h
```

## Environment-Specific Issues

### macOS Issues

#### Homebrew Conflicts
```bash
# Update Homebrew
brew update

# Check for conflicting packages
brew doctor

# Reinstall Node.js via Homebrew
brew uninstall node
brew install node
```

#### System Integrity Protection (SIP)
```bash
# If you get permission errors, don't disable SIP
# Instead, use user-level installations

npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Windows Issues

#### Windows Subsystem for Linux (WSL)
```powershell
# Install WSL if not present
wsl --install

# Use Linux-style paths in WSL
cd /home/username
```

#### PowerShell Execution Policy
```powershell
# Check execution policy
Get-ExecutionPolicy

# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Linux Issues

#### Missing Dependencies
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install curl build-essential

# CentOS/RHEL
sudo yum update
sudo yum groupinstall "Development Tools"
```

#### SELinux Issues
```bash
# Check SELinux status
getenforce

# Temporarily disable if needed (not recommended for production)
sudo setenforce 0
```

## Advanced Troubleshooting

### Debug Mode Installation

Enable verbose logging to diagnose complex issues:

```bash
# Install with verbose logging
npm install -g mcp-confluence-adf --verbose --foreground-scripts

# Run server with debug output
DEBUG=* LOG_LEVEL=debug npx mcp-confluence-adf
```

### Clean Installation

If all else fails, perform a clean installation:

```bash
# Remove all traces
npm uninstall -g mcp-confluence-adf
rm -rf ~/.npm/_cacache
rm -rf ~/.config/claude/

# Clear NPM cache
npm cache clean --force

# Reinstall everything
npm install -g mcp-confluence-adf
mkdir -p ~/.config/claude
claude mcp add --scope user mcp-confluence-adf npx mcp-confluence-adf

# Restart Claude Code
```

### Network and Proxy Issues

#### Corporate Firewalls
```bash
# Check if behind corporate firewall
curl -I https://registry.npmjs.org/

# Configure NPM proxy if needed
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or use corporate registry
npm config set registry https://npm.company.com/
```

#### SSL/TLS Issues
```bash
# Disable strict SSL (temporary)
npm config set strict-ssl false

# Or add corporate certificates
npm config set ca /path/to/corporate/ca.pem
```

## Verification Steps

After resolving issues, verify your installation:

### 1. Test MCP Server
```bash
# Check version
npx mcp-confluence-adf --version

# Test basic functionality
npx mcp-confluence-adf --help
```

### 2. Test Claude Code Integration
```bash
# List MCP servers
claude mcp list

# Check configuration
cat ~/.config/claude/settings.json | jq '.mcp.servers'
```

### 3. Test in Claude Code
Open Claude Code and run:
```
What Confluence tools do you have available?
```

You should see a list of MCP tools if everything is working correctly.

## Getting Additional Help

### Collect Diagnostic Information

Before seeking help, collect this diagnostic information:

```bash
# System information
uname -a
node --version
npm --version

# MCP server information
npx mcp-confluence-adf --version
npx mcp-confluence-adf --help

# Claude Code configuration
cat ~/.config/claude/settings.json | jq '.mcp.servers."mcp-confluence-adf"'

# Recent logs
tail -n 50 ~/.config/claude/logs/mcp.log
```

### Support Channels

1. **GitHub Issues**: https://github.com/JeromeErasmus/mcp-confluence-adf/issues
2. **Documentation**: Check related documentation files
3. **Community**: Search for similar issues in discussions

### When Creating Support Requests

Include:
- Operating system and version
- Node.js and NPM versions
- Complete error messages
- Steps you've already tried
- Diagnostic output from commands above

## Prevention

### Regular Maintenance

```bash
# Update packages regularly
npm update -g mcp-confluence-adf

# Keep Node.js updated
node --version  # Check current version
nvm install node --reinstall-packages-from=node  # If using nvm

# Keep Claude Code updated
# Update through the Claude Code application
```

### Best Practices

1. **Use Node Version Manager (NVM)** for managing Node.js versions
2. **Avoid sudo** for global NPM installations
3. **Keep backups** of working configurations
4. **Test updates** in a separate environment first
5. **Monitor logs** for early warning signs

## Common Configuration Patterns

### Development Setup
```json
{
  "mcp": {
    "servers": {
      "mcp-confluence-adf-dev": {
        "command": "node",
        "args": ["/absolute/path/to/mcp-confluence-adf/dist/server.js"],
        "env": {
          "DEBUG": "mcp:*",
          "LOG_LEVEL": "debug"
        }
      }
    }
  }
}
```

### Production Setup
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

### Multiple Instances
```json
{
  "mcp": {
    "servers": {
      "confluence-prod": {
        "command": "npx",
        "args": ["mcp-confluence-adf"]
      },
      "confluence-staging": {
        "command": "npx", 
        "args": ["mcp-confluence-adf"]
      }
    }
  }
}
```

## Next Steps

After resolving installation issues:

- **[Authentication Setup](./authentication-setup.md)** - Configure OAuth authentication
- **[Quick Start Guide](./quick-start-guide.md)** - Get up and running quickly  
- **[MCP Server Configuration](./mcp-server-configuration.md)** - Advanced server settings
- **[Error Handling](./error-handling.md)** - Runtime troubleshooting