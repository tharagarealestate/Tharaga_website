# Complete Guide: MCP Servers for Claude AI (claude.ai)

## Table of Contents
1. [Current Cursor MCP Configuration](#current-cursor-mcp-configuration)
2. [Setting Up MCPs for Claude AI](#setting-up-mcps-for-claude-ai)
3. [Tharaga Website APIs Available](#tharaga-website-apis-available)
4. [How to Use Each MCP Server](#how-to-use-each-mcp-server)
5. [Complete Setup Instructions](#complete-setup-instructions)

---

## Current Cursor MCP Configuration

### 6 MCP Servers Connected in Cursor

Based on the analysis of `C:\Users\DELL\.cursor\mcp.json`, you have these MCP servers configured:

#### 1. **Supabase MCP**
- **Type**: URL-based MCP server
- **Purpose**: Database management, queries, migrations, RLS policies
- **Configuration**:
  - Project: `wedevtjjmdvngyshqdro`
  - URL: `https://mcp.supabase.com/mcp?project_ref=wedevtjjmdvngyshqdro`

#### 2. **OpenAI MCP**
- **Type**: Command-based MCP server
- **Purpose**: GPT-4o AI interactions and content generation
- **Configuration**:
  - Model: GPT-4o
  - Command: `openai-mcp-server`

#### 3. **Filesystem MCP**
- **Type**: Command-based MCP server
- **Purpose**: File operations, search, directory management
- **Configuration**:
  - Command: `npx -y @modelcontextprotocol/server-filesystem .`

#### 4. **Netlify MCP**
- **Type**: Command-based MCP server
- **Purpose**: Netlify deployments, site management, monitoring
- **Configuration**:
  - Command: `npx -y @netlify/mcp`
  - Account: nithish631631@gmail.com

#### 5. **Advanced Reasoning MCP**
- **Type**: Custom Node.js server
- **Purpose**: MCTS, Beam Search, R1, and Hybrid reasoning
- **Configuration**:
  - Path: `E:\Tharaga_website\mcp-reasoning\dist\index.js`
  - Features: Complex problem-solving algorithms

#### 6. **Perplexity Research MCP**
- **Type**: Custom Node.js server
- **Purpose**: Real-time web search and research
- **Configuration**:
  - Path: `C:\Users\DELL\mcp\perplexity-tools\index.js`

---

## Setting Up MCPs for Claude AI

### Prerequisites

1. **Claude Desktop App** (Required for MCP support)
   - Download from: https://claude.ai/download
   - MCP is NOT available in claude.ai web version
   - Only works in Claude Desktop application

2. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org
   - Verify: `node --version`

### Configuration File Location

Claude Desktop MCP config file location:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Complete MCP Configuration for Claude Desktop

Create or update `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=wedevtjjmdvngyshqdro",
      "headers": {}
    },
    "openai": {
      "command": "npx",
      "args": ["-y", "openai-mcp-server"],
      "env": {
        "OPENAI_API_KEY": "YOUR_OPENAI_API_KEY_HERE",
        "MODEL": "gpt-4o"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "E:\\Tharaga_website"],
      "env": {}
    },
    "netlify": {
      "command": "npx",
      "args": ["-y", "@netlify/mcp"],
      "env": {
        "NETLIFY_PERSONAL_ACCESS_TOKEN": "YOUR_NETLIFY_TOKEN_HERE"
      }
    },
    "advanced-reasoning": {
      "command": "node",
      "args": ["E:\\Tharaga_website\\mcp-reasoning\\dist\\index.js"],
      "env": {}
    },
    "perplexity-research": {
      "command": "node",
      "args": ["C:\\Users\\DELL\\mcp\\perplexity-tools\\index.js"],
      "env": {
        "PERPLEXITY_API_KEY": "YOUR_PERPLEXITY_API_KEY_HERE"
      }
    },
    "tharaga-api": {
      "command": "node",
      "args": ["E:\\Tharaga_website\\mcp-servers\\tharaga-api\\index.js"],
      "env": {
        "SUPABASE_URL": "YOUR_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SUPABASE_SERVICE_ROLE_KEY",
        "NETLIFY_SITE_URL": "https://tharaga.co.in"
      }
    }
  }
}
```

### Important Security Notes

**DO NOT use the actual API keys shown in the Cursor config!** Instead:

1. **Get your own API keys**:
   - OpenAI: https://platform.openai.com/api-keys
   - Netlify: https://app.netlify.com/user/applications/personal
   - Perplexity: https://www.perplexity.ai/settings/api

2. **Use environment variables** (recommended):
   ```json
   "env": {
     "OPENAI_API_KEY": "${OPENAI_API_KEY}"
   }
   ```

3. **Never commit config files with API keys** to git

---

## Tharaga Website APIs Available

### Netlify Functions (27 API Endpoints)

Your Tharaga website has these APIs deployed as Netlify Functions:

#### **Admin APIs**
1. `admin-builders-list.js` - List all builders
2. `admin-builder-update.js` - Update builder information
3. `admin-get-builders.mjs` - Get builder details
4. `admin-leads-list.js` - List all leads
5. `admin-metrics.js` - Get admin metrics
6. `admin-properties-list.js` - List all properties (admin view)
7. `admin-stats.mjs` - Get statistics
8. `admin-verify-builder.mjs` - Verify builder accounts
9. `admin-verify-property.js` - Verify property listings

#### **Public APIs**
10. `api.js` - Proxy to backend server
11. `properties-list.js` - Get active property listings
12. `lead-create.js` - Create new lead/inquiry
13. `authCheckEmail.js` - Check email for authentication

#### **Automation & Messaging**
14. `digest-send.js` - Send email digests
15. `push-send.js` - Send push notifications
16. `push-subscribe.js` - Subscribe to push notifications

#### **Payment Integration**
17. `razorpayCreateSubscription.js` - Create Razorpay subscription
18. `razorpayWebhook.js` - Handle Razorpay webhooks
19. `stripeCheckout.js` - Stripe checkout session
20. `stripePortal.js` - Stripe customer portal
21. `stripeWebhook.js` - Handle Stripe webhooks

#### **User Management**
22. `user-add-role.mjs` - Add role to user
23. `user-roles.mjs` - Get user roles
24. `user-switch-role.mjs` - Switch user role

#### **Utilities**
25. `env-intel.js` - Environment intelligence
26. `recommendations.js` - Property recommendations
27. `send-verification-email.mjs` - Send verification emails

### API Base URLs

- **Production**: `https://tharaga.co.in/.netlify/functions/`
- **Example**: `https://tharaga.co.in/.netlify/functions/properties-list`

---

## How to Use Each MCP Server

### 1. Supabase MCP

**Available Operations**:
- Query database tables
- Create/apply migrations
- Generate TypeScript types
- Check security advisors
- View database schema
- Execute SQL queries

**Example Usage in Claude**:
```
"List all tables in my Supabase database"
"Show me the schema for the leads table"
"Create a migration to add a status field to properties"
"Execute this query: SELECT * FROM leads WHERE created_at > '2025-01-01'"
```

### 2. OpenAI MCP

**Available Operations**:
- Generate content using GPT-4o
- Code generation and analysis
- Documentation generation

**Example Usage**:
```
"Use GPT-4o to explain this code"
"Generate documentation for my API"
```

### 3. Filesystem MCP

**Available Operations**:
- Read/write files
- Search for files
- Create directory structures
- Get file information

**Example Usage**:
```
"Read the package.json file"
"Search for all files containing 'supabase'"
"List all TypeScript files in the src directory"
```

### 4. Netlify MCP

**Available Operations**:
- Deploy sites
- Check deployment status
- View deployment logs
- Manage environment variables
- List projects

**Example Usage**:
```
"Deploy the current site to Netlify"
"Check the status of the latest deployment"
"Show deployment logs"
"List all my Netlify sites"
```

### 5. Advanced Reasoning MCP

**Available Operations**:
- MCTS (Monte Carlo Tree Search) - Multi-path exploration
- Beam Search - Parallel approach evaluation
- R1 Transformer - Deep single-pass analysis
- Hybrid Reasoning - Combined MCTS + Transformer

**Example Usage**:
```
"Use MCTS reasoning to optimize this algorithm"
"Use beam search to compare authentication approaches"
"Use R1 to analyze this architecture pattern"
"Use hybrid reasoning to design a complete system"
```

### 6. Perplexity Research MCP

**Available Operations**:
- Real-time web search
- Research with citations
- Technology documentation lookup
- Current best practices

**Example Usage**:
```
"Research the latest Next.js 15 features"
"Search for Supabase authentication best practices"
"Find solutions for this error: [error message]"
```

### 7. Tharaga API MCP (Custom - To Be Created)

**Available Operations**:
- Access all 27 Netlify functions
- Query property listings
- Create leads
- Admin operations
- User management

**Example Usage**:
```
"Get all active property listings"
"Create a new lead for property ID 123"
"List all verified builders"
"Get admin metrics"
```

---

## Complete Setup Instructions

### Step 1: Install Claude Desktop

1. Download Claude Desktop from https://claude.ai/download
2. Install the application
3. Sign in with your Claude account

### Step 2: Install Node.js

1. Download Node.js from https://nodejs.org
2. Install Node.js (v18 or higher)
3. Verify installation: Open PowerShell and run `node --version`

### Step 3: Build the Advanced Reasoning MCP

```powershell
cd E:\Tharaga_website\mcp-reasoning
npm install
npm run build
```

### Step 4: Verify Perplexity Tools MCP

```powershell
cd C:\Users\DELL\mcp\perplexity-tools
# Check if index.js exists
ls index.js
```

### Step 5: Create Tharaga API MCP Server (Optional)

Create a custom MCP server for Tharaga APIs:

```powershell
cd E:\Tharaga_website
mkdir mcp-servers\tharaga-api
cd mcp-servers\tharaga-api
npm init -y
npm install @modelcontextprotocol/sdk node-fetch
```

Create `index.js`:
```javascript
// See THARAGA_API_MCP_SERVER.md for implementation
```

### Step 6: Configure Claude Desktop

1. Create config directory:
```powershell
mkdir "%APPDATA%\Claude" -Force
```

2. Create `claude_desktop_config.json`:
```powershell
notepad "%APPDATA%\Claude\claude_desktop_config.json"
```

3. Paste the configuration from above (with your API keys)

4. Save the file

### Step 7: Restart Claude Desktop

1. Completely close Claude Desktop
2. Check Task Manager to ensure it's closed
3. Reopen Claude Desktop
4. Wait for it to fully load

### Step 8: Verify MCP Servers

In Claude Desktop, try:
```
"List all available MCP servers"
"Use Supabase to list tables"
"Use Filesystem to read package.json"
```

---

## Troubleshooting

### MCP Servers Not Showing

1. **Verify config file location**:
   ```powershell
   notepad "%APPDATA%\Claude\claude_desktop_config.json"
   ```

2. **Check for JSON syntax errors**:
   - Use https://jsonlint.com to validate
   - Ensure all brackets and quotes match

3. **Restart Claude Desktop completely**:
   - Close all windows
   - Check Task Manager
   - Reopen

4. **Check Node.js installation**:
   ```powershell
   node --version
   npm --version
   ```

### Server Errors

1. **Check server paths exist**:
   ```powershell
   ls E:\Tharaga_website\mcp-reasoning\dist\index.js
   ls C:\Users\DELL\mcp\perplexity-tools\index.js
   ```

2. **Verify API keys**:
   - OpenAI: https://platform.openai.com/api-keys
   - Netlify: https://app.netlify.com/user/applications/personal
   - Perplexity: https://www.perplexity.ai/settings/api

3. **Check server logs**:
   - Claude Desktop may show error messages
   - Look in Claude settings for MCP status

### Permission Issues

Run PowerShell as Administrator if needed:
```powershell
Start-Process powershell -Verb RunAs
```

---

## API Keys Required

To use all MCP servers, you need these API keys:

1. **OpenAI API Key** (for OpenAI MCP)
   - Get from: https://platform.openai.com/api-keys
   - Cost: Pay-per-use (GPT-4o pricing)

2. **Netlify Personal Access Token** (for Netlify MCP)
   - Get from: https://app.netlify.com/user/applications/personal
   - Free tier available

3. **Perplexity API Key** (for Perplexity Research MCP)
   - Get from: https://www.perplexity.ai/settings/api
   - Cost: Pay-per-use

4. **Supabase Credentials** (already configured)
   - Project URL: Set in environment
   - Service Role Key: Set in environment

---

## Key Differences: Cursor vs Claude Desktop

### Cursor
- Integrated development environment
- Automatic AI assistance while coding
- MCP servers work seamlessly in the editor
- Config: `C:\Users\DELL\.cursor\mcp.json`

### Claude Desktop
- Standalone chat application
- General-purpose AI assistant
- MCP servers available through chat
- Config: `%APPDATA%\Claude\claude_desktop_config.json`

### Both Support
- Same MCP protocol
- Same server implementations
- Can use the same MCP servers
- Just different config file locations

---

## Next Steps

1. **Get your API keys** from the providers listed above
2. **Create the Claude Desktop config file** with your keys
3. **Restart Claude Desktop** to load MCP servers
4. **Test each server** to verify it works
5. **Create custom Tharaga API MCP** (optional) for direct website API access

---

## Additional Resources

- MCP Protocol Docs: https://modelcontextprotocol.io
- Claude Desktop Download: https://claude.ai/download
- Supabase MCP Docs: https://supabase.com/docs/guides/ai/mcp
- Netlify MCP Docs: https://github.com/netlify/mcp

---

**Created**: 2026-01-18
**Project**: Tharaga Real Estate Website
**Purpose**: Complete MCP setup guide for Claude AI integration
