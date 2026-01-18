# Claude Desktop MCP Setup - Completion Guide

**Status**: ✅ Configuration file created at `C:\Users\DELL\AppData\Roaming\Claude\claude_desktop_config.json`

---

## ✅ What's Already Done

1. ✅ Node.js v22.18.0 installed
2. ✅ Advanced Reasoning MCP server built successfully
3. ✅ Claude Desktop config directory created
4. ✅ MCP configuration file created with 6 servers

---

## 🔑 Step 5: Get Your API Keys

You need to get 3 API keys to enable all features:

### 1. OpenAI API Key (Optional - for GPT-4o)

**Get it from**: https://platform.openai.com/api-keys

**Steps**:
1. Go to https://platform.openai.com/api-keys
2. Sign in with your OpenAI account (or create one)
3. Click "Create new secret key"
4. Give it a name (e.g., "Claude Desktop MCP")
5. Copy the key (starts with `sk-proj-...`)

**Cost**: Pay-per-use (GPT-4o is about $2.50 per 1M input tokens)

**Note**: You can skip this if you don't need OpenAI integration

---

### 2. Netlify Personal Access Token (Optional - for deployments)

**Get it from**: https://app.netlify.com/user/applications/personal

**Steps**:
1. Go to https://app.netlify.com/user/applications/personal
2. Sign in with your Netlify account
3. Click "New access token"
4. Give it a name (e.g., "Claude Desktop MCP")
5. Copy the token (starts with `nfp_...`)

**Cost**: Free tier available

**Note**: You can skip this if you don't need Netlify deployments

---

### 3. Perplexity API Key (Optional - for web research)

**Get it from**: https://www.perplexity.ai/settings/api

**Steps**:
1. Go to https://www.perplexity.ai/settings/api
2. Sign in with your Perplexity account (or create one)
3. Click "Generate API Key"
4. Copy the key (starts with `pplx-...`)

**Cost**: Free tier available, then pay-per-use

**Note**: You can skip this if you don't need web research

---

## 📝 Step 6: Add Your API Keys to Config

**Method 1: Using Text Editor**

1. Open the config file:
   ```powershell
   notepad "%APPDATA%\Claude\claude_desktop_config.json"
   ```

2. Replace these placeholders:
   - `REPLACE_WITH_YOUR_OPENAI_API_KEY` → Your OpenAI key
   - `REPLACE_WITH_YOUR_NETLIFY_TOKEN` → Your Netlify token
   - `REPLACE_WITH_YOUR_PERPLEXITY_API_KEY` → Your Perplexity key

3. Save the file (Ctrl+S)

**Method 2: Using PowerShell (Quick)**

Run these commands with your actual API keys:

```powershell
# Set OpenAI API key
$config = Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" -Raw
$config = $config -replace 'REPLACE_WITH_YOUR_OPENAI_API_KEY', 'sk-proj-YOUR_ACTUAL_KEY_HERE'
$config | Set-Content "$env:APPDATA\Claude\claude_desktop_config.json"

# Set Netlify token
$config = Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" -Raw
$config = $config -replace 'REPLACE_WITH_YOUR_NETLIFY_TOKEN', 'nfp_YOUR_ACTUAL_TOKEN_HERE'
$config | Set-Content "$env:APPDATA\Claude\claude_desktop_config.json"

# Set Perplexity API key
$config = Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" -Raw
$config = $config -replace 'REPLACE_WITH_YOUR_PERPLEXITY_API_KEY', 'pplx_YOUR_ACTUAL_KEY_HERE'
$config | Set-Content "$env:APPDATA\Claude\claude_desktop_config.json"
```

---

## 🚀 Step 7: Start/Restart Claude Desktop

### If Claude Desktop is Running:
1. **Close Claude Desktop completely**
   - Right-click system tray icon → Quit
   - Or use Task Manager to ensure it's closed
2. **Wait 10 seconds**
3. **Open Claude Desktop again**

### If Claude Desktop is Not Running:
1. **Launch Claude Desktop** from Start Menu or desktop shortcut
2. **Wait for it to fully load**

---

## ✅ Step 8: Verify MCP Servers

Once Claude Desktop is open, try these commands:

### Test Supabase (No API key needed)
```
"Use Supabase to list all tables"
"Show me the schema for the leads table"
```

### Test Filesystem (No API key needed)
```
"Use Filesystem to list files in E:\Tharaga_website"
"Read the package.json file"
```

### Test Advanced Reasoning (No API key needed)
```
"Use MCTS reasoning to find the best approach for caching"
"Use beam search to compare 3 authentication methods"
```

### Test OpenAI (Requires API key)
```
"Use OpenAI to generate a summary of my project"
```

### Test Netlify (Requires API key)
```
"Use Netlify to list my sites"
"Check deployment status"
```

### Test Perplexity (Requires API key)
```
"Use Perplexity to research Next.js 15 features"
"Find the latest documentation for Supabase"
```

---

## 🎯 Which MCP Servers Work Without API Keys?

| Server | Works Without API Key? | Notes |
|--------|------------------------|-------|
| ✅ **Supabase** | YES | Uses project URL, already configured |
| ✅ **Filesystem** | YES | No API key needed |
| ✅ **Advanced Reasoning** | YES | Custom server, no API key needed |
| ❌ **OpenAI** | NO | Requires OpenAI API key |
| ❌ **Netlify** | NO | Requires personal access token |
| ❌ **Perplexity** | NO | Requires Perplexity API key |

**You can start using 3 MCP servers immediately without any API keys!**

---

## 🔍 Troubleshooting

### MCP Servers Not Showing in Claude Desktop

1. **Verify config file**:
   ```powershell
   notepad "%APPDATA%\Claude\claude_desktop_config.json"
   ```
   - Check for JSON syntax errors
   - Use https://jsonlint.com to validate

2. **Check file paths exist**:
   ```powershell
   # Check Advanced Reasoning server
   ls E:\Tharaga_website\mcp-reasoning\dist\index.js

   # Check Perplexity server
   ls C:\Users\DELL\mcp\perplexity-tools\index.js
   ```

3. **Restart Claude Desktop completely**:
   - Close all windows
   - Check Task Manager (Ctrl+Shift+Esc)
   - Ensure "Claude" process is not running
   - Reopen Claude Desktop

### Server Errors in Claude Desktop

If a server shows an error:

1. **Check the error message** in Claude Desktop settings
2. **Verify API keys are correct** (no extra spaces, quotes, etc.)
3. **Check Node.js is in PATH**:
   ```powershell
   node --version
   npm --version
   ```

### Can't Find Claude Desktop Settings

In Claude Desktop:
1. Click your profile icon (top right)
2. Go to "Settings"
3. Look for "Features" or "MCP" section

---

## 📊 Expected Results

After setup, you should see in Claude Desktop settings:

```
MCP Servers (6 total):

✅ supabase           - Connected
✅ filesystem         - Connected
✅ advanced-reasoning - Connected
⚠️ openai            - Needs API key
⚠️ netlify           - Needs API key
⚠️ perplexity-research - Needs API key
```

---

## 🎉 Usage Examples

### Example 1: Database Query
```
You: "Use Supabase to show me all leads from the last 7 days"

Claude: [Uses Supabase MCP to query database]
```

### Example 2: File Operations
```
You: "Use Filesystem to read the .env file and show me what environment variables are set"

Claude: [Uses Filesystem MCP to read file]
```

### Example 3: Complex Problem Solving
```
You: "Use MCTS reasoning to determine the best caching strategy for my Next.js app"

Claude: [Uses Advanced Reasoning MCP with MCTS algorithm]
```

### Example 4: Research + Analysis
```
You: "Use Perplexity to research React Server Components, then use beam search to compare it with traditional SSR"

Claude: [Uses both Perplexity and Advanced Reasoning MCPs]
```

---

## 🔐 Security Best Practices

1. **Never share your API keys** with anyone
2. **Never commit API keys** to git repositories
3. **Use different API keys** for development and production
4. **Rotate API keys** periodically
5. **Set spending limits** on OpenAI and Perplexity accounts

---

## 💰 Cost Estimates

### OpenAI (GPT-4o)
- **Input**: $2.50 per 1M tokens
- **Output**: $10.00 per 1M tokens
- **Typical usage**: $5-20/month for moderate use

### Netlify
- **Free tier**: 100GB bandwidth, 300 build minutes/month
- **Pro**: $19/month for more resources

### Perplexity
- **Free tier**: 5 API calls per day
- **Pro**: $20/month for 300 API calls/day

**Total estimated cost**: $0-50/month depending on usage

---

## 📚 Next Steps

1. ✅ **Get API keys** from the providers (optional)
2. ✅ **Update config file** with your API keys
3. ✅ **Restart Claude Desktop**
4. ✅ **Test MCP servers** with the commands above
5. 🚀 **Start using MCPs** in your daily workflow!

---

## 📁 Configuration File Location

**Your config file**: `C:\Users\DELL\AppData\Roaming\Claude\claude_desktop_config.json`

**Quick access**:
```powershell
notepad "%APPDATA%\Claude\claude_desktop_config.json"
```

---

## 🆘 Need Help?

- **Troubleshooting**: See `MCP_TROUBLESHOOTING.md`
- **Usage guide**: See `HOW_TO_USE_MCP_SERVERS.md`
- **Quick reference**: See `MCP_QUICK_REFERENCE.md`

---

**Setup Date**: January 18, 2026
**Status**: ✅ Configuration complete, API keys pending
**Ready to use**: 3 out of 6 MCP servers (without API keys)
