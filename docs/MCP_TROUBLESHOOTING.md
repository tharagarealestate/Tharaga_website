# 🔧 MCP Servers Not Visible - Troubleshooting Guide

If you can't see MCP servers when using `@` in Cursor, follow these steps:

---

## ⚠️ **IMPORTANT: MCP Servers Must Be Restarted**

After configuring MCP servers, you **MUST** restart Cursor completely for them to appear.

### **Steps to Restart:**

1. **Close Cursor Completely**
   - Close all Cursor windows
   - Make sure Cursor is not running in the background
   - Check Task Manager (Windows) to ensure it's fully closed

2. **Reopen Cursor**
   - Open Cursor again
   - Wait for it to fully load

3. **MCP Servers Should Now Be Available**

---

## 🔍 **How to Check if MCP Servers Are Loaded**

### **Method 1: Check MCP Settings (Recommended)**

1. Open Cursor Settings:
   - Press `Ctrl + ,` (or `Cmd + ,` on Mac)
   - Or: `File` → `Preferences` → `Settings`

2. Go to MCP Settings:
   - Search for "MCP" in settings
   - Or navigate to: `Features` → `MCP`

3. Check Server Status:
   - You should see all 6 servers listed:
     - ✅ supabase
     - ✅ openai
     - ✅ filesystem
     - ✅ netlify-nivethalakshmi
     - ✅ advanced-reasoning
     - ✅ perplexity-research

4. Verify They're Enabled:
   - Each server should show as "Enabled" or "Connected"
   - If disabled, toggle them on

### **Method 2: Try Using MCP in Chat**

1. Open Cursor Chat (if available in your plan)
2. Type `@` to see available MCP servers
3. You should see a list of available servers

### **Method 3: Check for Errors**

1. Open Cursor Settings → MCP
2. Look for any error messages or warnings
3. Check if any servers show "Error" or "Disconnected"

---

## ✅ **Quick Fixes**

### **Fix 1: Verify Configuration File**

Your MCP config file is at: `C:\Users\DELL\.cursor\mcp.json`

Make sure it contains all 6 servers (we already verified this is correct).

### **Fix 2: Check File Paths**

Verify these paths exist:
- ✅ `C:\Users\DELL\mcp\perplexity-tools\index.js` (exists)
- ✅ `E:\Tharaga_website\mcp-reasoning\dist\index.js` (exists)

### **Fix 3: Verify Node.js is Available**

1. Open PowerShell
2. Run: `node --version`
3. If Node.js is not found, install it from: https://nodejs.org

### **Fix 4: Test Server Startup**

Try running a server manually to check for errors:

```powershell
# Test Perplexity server
cd C:\Users\DELL\mcp\perplexity-tools
$env:PERPLEXITY_API_KEY="your-perplexity-api-key-here"  # Use environment variable or config
node index.js
```

If you see errors, note them down.

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: MCP Servers Not Appearing After Restart**

**Solution:**
- Make sure Cursor is completely closed (check Task Manager)
- Wait 10-30 seconds after closing
- Reopen Cursor
- Check Settings → Features → MCP

### **Issue 2: Servers Show as "Error" or "Disconnected"**

**Possible Causes:**
- Node.js not in PATH
- Server files don't exist
- API keys are invalid
- Network issues

**Solution:**
- Check the error message in Cursor Settings → MCP
- Verify Node.js is installed: `node --version`
- Verify server files exist (we already checked)
- Test API keys are valid

### **Issue 3: Only Some Servers Visible**

**Solution:**
- Check which servers are working
- Focus on fixing the ones that aren't
- Some servers (like Supabase URL-based) might work differently

### **Issue 4: "@" Doesn't Show MCP List**

**Possible Causes:**
- You're not using a plan that supports MCP
- MCP feature is disabled
- Cursor needs an update

**Solution:**
- Check your Cursor plan - MCP requires Pro or higher
- Update Cursor to the latest version
- Check Settings → Features → MCP is enabled

---

## 📋 **Step-by-Step Verification Checklist**

Use this checklist to verify everything is set up correctly:

- [ ] Cursor is completely closed (check Task Manager)
- [ ] Cursor has been reopened
- [ ] Node.js is installed (`node --version` works)
- [ ] MCP config file exists: `C:\Users\DELL\.cursor\mcp.json`
- [ ] All 6 servers are in the config file
- [ ] Perplexity server file exists: `C:\Users\DELL\mcp\perplexity-tools\index.js`
- [ ] Advanced Reasoning server file exists: `E:\Tharaga_website\mcp-reasoning\dist\index.js`
- [ ] Settings → Features → MCP shows servers
- [ ] Servers are enabled in MCP settings
- [ ] No error messages in MCP settings

---

## 🔄 **Alternative: Use MCP Servers Directly**

If `@` doesn't work, you can still use MCP servers by:

1. **Ask me directly** to use an MCP server:
   ```
   "Use the Supabase MCP server to list all tables"
   "Use Perplexity Research to find information about..."
   "Use Advanced Reasoning with MCTS to solve..."
   ```

2. **I'll automatically use the appropriate MCP server** based on your request

3. **Check Cursor's output** - MCP servers work in the background

---

## 📞 **Still Not Working?**

If MCP servers still don't appear after following all steps:

1. **Check Cursor Version:**
   - Make sure you're on the latest version
   - MCP support might require a specific version

2. **Check Your Plan:**
   - MCP features require Cursor Pro or higher
   - Verify your subscription status

3. **Check for Updates:**
   - Settings → About → Check for Updates

4. **Contact Cursor Support:**
   - If nothing works, contact Cursor support
   - Include your Cursor version and configuration

---

## 💡 **Important Notes**

- **MCP servers work in the background** - you might not always see them explicitly
- **I can use MCP servers automatically** based on your requests
- **The `@` symbol** might not be available in all Cursor interfaces
- **Some servers work better when requested directly** (like "Use Supabase to...")

---

## ✅ **Quick Test**

Try asking me to use an MCP server directly:

1. "Use Supabase MCP to list all tables"
2. "Use Perplexity Research to find the latest Next.js features"
3. "Use Advanced Reasoning with MCTS to optimize this code"

If I can use these servers, they're working - even if `@` doesn't show them!







