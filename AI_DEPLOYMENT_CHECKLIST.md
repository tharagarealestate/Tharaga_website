# 🤖 AI Assistant Deployment Checklist

**This is the procedure I (the AI) will follow for EVERY Netlify deployment task.**

## ✅ Pre-Deployment

- [ ] Verify `netlify.toml` configuration is correct
- [ ] Check environment variables are documented
- [ ] Ensure build command is valid
- [ ] Verify function directory paths

## 🚀 Deployment Initiation

### Option A: Git Push (Automatic)
1. Commit changes
2. Push to connected branch (usually `main`)
3. **Wait 30-60 seconds** for Netlify to detect
4. Get latest deploy using site ID

### Option B: Manual Deploy via MCP
1. Use `mcp_netlify_netlify-deploy-services-updater`
2. **Capture `deployId` immediately** from response
3. Note the `siteId` if available

## 📊 Monitoring Phase (AUTOMATIC)

**I will automatically do this for EVERY deployment:**

### Step 1: Initial Wait
- Wait 30 seconds after deployment initiation
- This allows Netlify to process the deployment

### Step 2: Start Polling Loop
```
DO:
  - Call mcp_netlify_netlify-deploy-services-reader with deployId
  - Check deploy.state
  - Log current state and elapsed time
  
  IF state === "ready":
    ✅ SUCCESS - Verify site access, report completion
    EXIT monitoring
    
  IF state === "error":
    ❌ FAILURE - Check logs, report error details
    EXIT monitoring
    
  IF state === "building" OR "enqueued" OR "preparing":
    ⏳ WAITING - Wait 30 seconds
    CONTINUE loop
    
  IF elapsed time > 10 minutes:
    ⚠️ TIMEOUT - Report timeout, check manually
    EXIT monitoring
    
WHILE state is not "ready" or "error"
```

### Step 3: Error Investigation (if failed)
- [ ] Read build logs from deployment
- [ ] Check function logs if applicable
- [ ] Identify specific error message
- [ ] Check common issues:
  - Missing environment variables
  - Build command errors
  - Dependency installation failures
  - Function syntax errors
  - Configuration file errors

### Step 4: Success Verification (if succeeded)
- [ ] Get published URL from deployment
- [ ] Verify site is accessible
- [ ] Check that functions are deployed (if applicable)
- [ ] Report success with deployment URL

## 🔄 Retry Logic

If deployment fails with transient error:
- Retry up to 3 times
- Wait 60 seconds between retries
- Only retry on: network errors, temporary build failures
- Do NOT retry on: configuration errors, syntax errors

## 📝 Reporting

### On Success:
```
✅ Deployment Successful!
📍 URL: https://your-site.netlify.app
⏱️  Build time: X minutes
📦 Functions deployed: X/X
```

### On Failure:
```
❌ Deployment Failed
🔍 Error: [specific error message]
📋 Logs: [relevant log excerpt]
💡 Suggested fix: [actionable solution]
```

## 🎯 Key Rules for AI

1. **NEVER** assume deployment succeeded without checking status
2. **ALWAYS** monitor until "ready" or "error" state
3. **ALWAYS** capture deployId immediately after deployment
4. **ALWAYS** check logs when state is "error"
5. **ALWAYS** verify site accessibility on success
6. **NEVER** stop monitoring before final state
7. **ALWAYS** report specific error details, not generic messages

## 🔧 MCP Function Calls Pattern

### Get Deployment Status
```javascript
// After getting deployId
const deploy = await mcp_netlify_netlify-deploy-services-reader({
  selectSchema: {
    operation: "get-deploy",
    params: { deployId: "<captured-deploy-id>" }
  }
});

// Check deploy.state, deploy.published_at, deploy.error_message
```

### Get Latest Deploy for Site (Git deployments)
```javascript
// First, get site ID from projects
const projects = await mcp_netlify_netlify-project-services-reader({
  selectSchema: {
    operation: "get-projects"
  }
});

// Then get latest deploy
const deploy = await mcp_netlify_netlify-deploy-services-reader({
  selectSchema: {
    operation: "get-deploy-for-site",
    params: {
      siteId: "<site-id>",
      deployId: "<latest-deploy-id>" // or get from site's deploy list
    }
  }
});
```

## ⚡ Quick Reference

| State | Action | Wait Time |
|-------|--------|-----------|
| `enqueued` | Continue monitoring | 15s |
| `preparing` | Continue monitoring | 20s |
| `building` | Continue monitoring | 30s |
| `ready` | ✅ Success - Verify & Report | N/A |
| `error` | ❌ Failure - Check logs | N/A |

## 🚨 Common Errors & Quick Fixes

| Error Type | Likely Cause | Fix |
|------------|--------------|-----|
| Build timeout | Long build process | Increase build timeout in netlify.toml |
| Function error | Syntax/runtime error | Check function logs, fix code |
| Missing env var | Env var not set | Add to Netlify dashboard |
| npm install fail | Package.json issue | Check dependencies, update lockfile |
| Build command fail | Invalid command | Verify command in netlify.toml |

---

**Remember:** This checklist is for ME (the AI) to follow. I will automatically execute this procedure during any Netlify deployment task without you needing to remind me.


























































