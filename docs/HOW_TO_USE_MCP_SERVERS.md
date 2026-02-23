# How to Use MCP Servers - Complete Guide

## Quick Start

This guide shows you how to use all MCP servers with both Cursor and Claude Desktop.

---

## Table of Contents

1. [What are MCP Servers?](#what-are-mcp-servers)
2. [Current Setup Status](#current-setup-status)
3. [Using MCPs in Cursor](#using-mcps-in-cursor)
4. [Using MCPs in Claude Desktop](#using-mcps-in-claude-desktop)
5. [Practical Examples](#practical-examples)
6. [Common Workflows](#common-workflows)
7. [Troubleshooting](#troubleshooting)

---

## What are MCP Servers?

**MCP (Model Context Protocol)** is a standard protocol that allows AI assistants (like Claude) to:
- Access external tools and services
- Query databases
- Read/write files
- Call APIs
- Perform complex operations

Think of MCP servers as **plugins** or **extensions** that give Claude superpowers!

---

## Current Setup Status

### ✅ Already Configured in Cursor

You have **6 MCP servers** already working in Cursor:

1. **Supabase** - Your database operations
2. **OpenAI** - GPT-4o AI capabilities
3. **Filesystem** - File operations
4. **Netlify** - Deployment management
5. **Advanced Reasoning** - Complex problem-solving (MCTS, Beam Search, R1, Hybrid)
6. **Perplexity Research** - Real-time web search

**Config File**: `C:\Users\DELL\.cursor\mcp.json`

### 🔧 To Be Configured in Claude Desktop

You can set up the same servers in Claude Desktop for use outside of coding.

**Config File**: `%APPDATA%\Claude\claude_desktop_config.json`

---

## Using MCPs in Cursor

### How to Use

When working in Cursor, you can directly request MCP operations:

```
"List all tables in my Supabase database"
"Deploy this to Netlify"
"Use MCTS reasoning to optimize this code"
"Research the latest Next.js features"
"Read the package.json file"
```

Cursor automatically uses the appropriate MCP server based on your request.

### Verification

To check if MCP servers are loaded in Cursor:
1. Open Cursor Settings (`Ctrl + ,`)
2. Search for "MCP"
3. Navigate to Features → MCP
4. You should see all 6 servers listed as "Enabled"

### Common Tasks in Cursor

#### Database Operations (Supabase MCP)
```
"Show me the schema for the leads table"
"Create a migration to add a priority field"
"Execute: SELECT * FROM properties WHERE city = 'Chennai'"
"Generate TypeScript types for my database"
```

#### Deployment (Netlify MCP)
```
"Deploy the current changes to Netlify"
"Check deployment status"
"Show me the latest deployment logs"
"What's the production URL?"
```

#### File Operations (Filesystem MCP)
```
"Read the .env file"
"Search for all files using Supabase client"
"List all TypeScript files in src/components"
"Show me the project structure"
```

#### Problem Solving (Advanced Reasoning MCP)
```
"Use MCTS reasoning to find the best way to implement caching"
"Use beam search to compare 3 authentication approaches"
"Use R1 to deeply analyze this performance bottleneck"
"Use hybrid reasoning to design this microservices architecture"
```

#### Research (Perplexity MCP)
```
"Research the latest Supabase RLS best practices"
"Find documentation for Next.js 15 app router"
"Search for solutions to this TypeScript error"
"What are the current trends in React state management?"
```

---

## Using MCPs in Claude Desktop

### Setup Steps

#### 1. Install Claude Desktop

Download and install from: https://claude.ai/download

#### 2. Get API Keys

You'll need API keys for some services:

- **OpenAI**: https://platform.openai.com/api-keys (for GPT-4o)
- **Netlify**: https://app.netlify.com/user/applications/personal
- **Perplexity**: https://www.perplexity.ai/settings/api

#### 3. Create Config File

Create `%APPDATA%\Claude\claude_desktop_config.json`:

```powershell
notepad "%APPDATA%\Claude\claude_desktop_config.json"
```

Paste the configuration from `CLAUDE_AI_MCP_SETUP_GUIDE.md`

#### 4. Restart Claude Desktop

- Close completely (check Task Manager)
- Reopen
- Wait for full startup

#### 5. Verify

Try in Claude Desktop:
```
"List all available MCP servers"
"Use Supabase to show tables"
```

### How to Use in Claude Desktop

Once configured, use natural language:

```
"Use Supabase MCP to get all leads from the database"
"Use Netlify to check deployment status"
"Use Filesystem to read the README file"
"Use Perplexity to research Claude API best practices"
"Use Advanced Reasoning with MCTS to solve this problem"
```

---

## Practical Examples

### Example 1: Full Feature Development Workflow

**Scenario**: Build a new property search feature

```
1. "Use Perplexity to research best practices for search UI"
   → Gets latest design patterns

2. "Use Advanced Reasoning with hybrid to design the search architecture"
   → Plans the implementation

3. "Use Supabase to create a migration for search_history table"
   → Sets up database

4. "Use Filesystem to create components/PropertySearch.tsx"
   → Creates files

5. "Use Netlify to deploy and monitor"
   → Deploys and checks status
```

### Example 2: Bug Investigation

**Scenario**: Users report slow property loading

```
1. "Use Perplexity to find common causes of slow Next.js data fetching"
   → Research solutions

2. "Use Filesystem to search for property fetching code"
   → Find relevant files

3. "Use Supabase to check database performance advisors"
   → Check database issues

4. "Use Advanced Reasoning with R1 to analyze the root cause"
   → Deep analysis

5. "Use MCTS reasoning to find the best optimization approach"
   → Solution planning
```

### Example 3: Data Analysis

**Scenario**: Analyze lead conversion rates

```
1. "Use Supabase to get all leads from the last 30 days"
   → Fetch data

2. "Use Advanced Reasoning with beam search to analyze patterns"
   → Find insights

3. "Use Perplexity to research industry benchmarks for conversion rates"
   → Compare with standards

4. "Use Supabase to create a view for lead analytics"
   → Set up reporting
```

### Example 4: Tharaga Website Management

**Scenario**: Manage property listings

```
1. "Use tharaga-api to get all active property listings"
   → View current listings

2. "Use tharaga-api to create a new lead"
   → Add inquiry

3. "Use tharaga-api to get admin metrics"
   → Check dashboard stats

4. "Use Supabase to verify property data integrity"
   → Validate database
```

---

## Common Workflows

### Daily Development Workflow

```
Morning:
- "Use Netlify to check if production is healthy"
- "Use Supabase to check for new leads overnight"

During Development:
- "Use Filesystem to read/write code"
- "Use Advanced Reasoning for complex decisions"
- "Use Perplexity to research new libraries"

Before Deployment:
- "Use Supabase to check database migrations"
- "Use Netlify to deploy and monitor"
```

### Admin Dashboard Workflow

```
- "Use tharaga-api to get admin metrics"
- "Use tharaga-api to list all pending verifications"
- "Use tharaga-api to verify builders and properties"
- "Use Supabase to run custom analytics queries"
```

### Content & Marketing Workflow

```
- "Use Perplexity to research SEO best practices"
- "Use tharaga-api to get property recommendations"
- "Use Advanced Reasoning to optimize email campaigns"
- "Use Supabase to analyze user behavior"
```

---

## When to Use Which MCP

| Task | Best MCP Server |
|------|----------------|
| Database queries | Supabase |
| Database schema changes | Supabase |
| Security & performance checks | Supabase |
| File read/write | Filesystem |
| Code search | Filesystem |
| Deploy website | Netlify |
| Check deployment status | Netlify |
| Complex problem solving | Advanced Reasoning (MCTS/Beam/Hybrid) |
| Deep analysis | Advanced Reasoning (R1) |
| Real-time info/research | Perplexity Research |
| AI content generation | OpenAI |
| Property listings | Tharaga API |
| Lead management | Tharaga API |
| Admin operations | Tharaga API |

---

## Combining Multiple MCPs

### Powerful Combinations

#### Research + Analysis + Implementation
```
1. Perplexity: "Research authentication best practices"
2. Advanced Reasoning: "Use hybrid to design auth system"
3. Supabase: "Create auth tables and RLS policies"
4. Filesystem: "Create auth components"
5. Netlify: "Deploy and verify"
```

#### Debug + Fix + Deploy
```
1. Filesystem: "Search for error in codebase"
2. Perplexity: "Research this error message"
3. Advanced Reasoning: "Use R1 to analyze root cause"
4. Supabase: "Check database logs"
5. Netlify: "Deploy fix and monitor"
```

#### Data Analysis + Reporting
```
1. Tharaga API: "Get all property data"
2. Supabase: "Run analytics queries"
3. Advanced Reasoning: "Use beam search to find patterns"
4. Perplexity: "Research industry benchmarks"
5. OpenAI: "Generate executive summary"
```

---

## Tips for Effective MCP Usage

### 1. Be Specific
❌ Bad: "Check the database"
✅ Good: "Use Supabase to show the schema for the leads table"

### 2. Chain Commands
❌ Bad: Making separate requests for related tasks
✅ Good: "Use Perplexity to research caching strategies, then use MCTS reasoning to choose the best one for our use case"

### 3. Use the Right Tool
❌ Bad: "Use OpenAI to deploy to Netlify" (wrong tool)
✅ Good: "Use Netlify to deploy and monitor the deployment"

### 4. Combine for Power
✅ Best: "Use Perplexity to research, Advanced Reasoning to analyze, Supabase to implement, and Netlify to deploy"

### 5. Verify Results
✅ Always: "Use Netlify to verify the deployment succeeded"

---

## Troubleshooting

### MCP Not Working in Cursor

1. **Restart Cursor completely**
   - Close all windows
   - Check Task Manager
   - Reopen

2. **Check config file**
   ```powershell
   notepad "C:\Users\DELL\.cursor\mcp.json"
   ```

3. **Verify paths exist**
   ```powershell
   ls E:\Tharaga_website\mcp-reasoning\dist\index.js
   ls C:\Users\DELL\mcp\perplexity-tools\index.js
   ```

4. **Check Cursor Settings**
   - Settings → Features → MCP
   - Verify servers are enabled

### MCP Not Working in Claude Desktop

1. **Verify config file location**
   ```powershell
   notepad "%APPDATA%\Claude\claude_desktop_config.json"
   ```

2. **Check JSON syntax**
   - Use https://jsonlint.com
   - Ensure all brackets and commas are correct

3. **Verify Node.js installed**
   ```powershell
   node --version
   ```

4. **Restart Claude Desktop**
   - Close completely
   - Check Task Manager
   - Reopen

### Specific Server Issues

#### Supabase MCP
- Verify project ref is correct
- Check network connectivity
- Ensure Supabase project is active

#### Netlify MCP
- Verify personal access token is valid
- Check token has correct permissions
- Ensure site exists

#### Advanced Reasoning MCP
- Build the server: `cd E:\Tharaga_website\mcp-reasoning && npm run build`
- Verify dist/index.js exists

#### Perplexity MCP
- Verify API key is valid
- Check API quota not exceeded

---

## Advanced Usage

### Custom Tool Chaining

Create complex workflows by chaining MCP calls:

```
"First, use Perplexity to research Redis caching best practices for Next.js.
Then, use Advanced Reasoning with beam search to compare Redis vs. in-memory vs. edge caching.
Next, use Supabase to check our current database performance.
After that, use MCTS reasoning to design the optimal caching strategy.
Finally, use Filesystem to show me where to implement the cache layer."
```

### Automated Workflows

Set up recurring MCP workflows:

```
Daily health check:
- "Use Netlify to check production status"
- "Use Supabase to count new leads"
- "Use tharaga-api to get admin metrics"

Weekly analysis:
- "Use Supabase to get weekly stats"
- "Use Advanced Reasoning to analyze trends"
- "Use Perplexity to compare with industry"
```

---

## Quick Reference Commands

### Database (Supabase)
```
"List all tables"
"Show schema for [table]"
"Execute: [SQL query]"
"Create migration: [description]"
"Check security advisors"
"Generate TypeScript types"
```

### Deployment (Netlify)
```
"Deploy to Netlify"
"Check deployment status"
"Show deployment logs"
"List all sites"
"Get deployment URL"
```

### Files (Filesystem)
```
"Read [file path]"
"Search for [text] in [directory]"
"List files in [directory]"
"Show directory structure"
```

### Research (Perplexity)
```
"Research [topic]"
"Find documentation for [library]"
"Search for solutions to [error]"
"What are best practices for [task]"
```

### Reasoning (Advanced)
```
"Use MCTS to [solve problem]"
"Use beam search to [compare options]"
"Use R1 to [analyze deeply]"
"Use hybrid to [complex task]"
```

### APIs (Tharaga)
```
"Get property listings"
"Create a lead"
"Get admin metrics"
"Verify builder/property"
"Get user roles"
```

---

## Next Steps

1. **✅ Already Working**: Use MCP servers in Cursor right now
2. **🔧 Optional Setup**: Configure Claude Desktop for non-coding tasks
3. **🚀 Build Custom**: Create Tharaga API MCP server for direct API access
4. **📚 Learn More**: Experiment with combining multiple MCPs

---

## Additional Resources

- **MCP Protocol**: https://modelcontextprotocol.io
- **Cursor MCP Guide**: `MCP_SERVERS_USAGE_GUIDE.md`
- **Troubleshooting**: `MCP_TROUBLESHOOTING.md`
- **Claude Setup**: `CLAUDE_AI_MCP_SETUP_GUIDE.md`
- **Tharaga API**: `THARAGA_API_MCP_SERVER_IMPLEMENTATION.md`

---

**Last Updated**: 2026-01-18
**Status**: All 6 MCP servers active in Cursor
**Next**: Optional Claude Desktop setup
