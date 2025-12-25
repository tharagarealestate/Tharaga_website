# Netlify Deployment Monitoring Procedure

## Overview
This document outlines the procedure for automatically monitoring Netlify deployments, checking for errors, and ensuring successful completion.

## Deployment Monitoring Workflow

### Step 1: Initiate Deployment
When deploying to Netlify:
1. Use `mcp_netlify_netlify-deploy-services-updater` to deploy
2. Capture the `deployId` from the response
3. If deploying via Git push, wait ~30 seconds for Netlify to detect the commit

### Step 2: Monitor Deployment Status
Use the following polling pattern:

```javascript
// Pseudo-code for monitoring logic
1. Get initial deploy status using deployId
2. Check deploy state:
   - "building" → Wait 30 seconds, check again
   - "ready" → Deployment successful! ✅
   - "error" → Check logs, report error, retry if needed
   - "enqueued" → Wait 15 seconds, check again
3. Repeat until state is "ready" or "error"
4. Maximum wait time: 10 minutes (20 checks at 30s intervals)
```

### Step 3: Check Deployment Details
For each status check, verify:
- **State**: building, ready, error, enqueued
- **Build logs**: Check for errors in build output
- **Function logs**: If functions are deployed, check their status
- **Published URL**: Verify the site is accessible

### Step 4: Error Handling
If deployment fails:
1. **Read build logs** to identify the error
2. **Check function logs** if serverless functions are involved
3. **Verify environment variables** are set correctly
4. **Check netlify.toml** configuration
5. **Retry deployment** if it's a transient error
6. **Report specific error** to user with remediation steps

### Step 5: Success Verification
Once deployment shows "ready":
1. Verify site is accessible at the published URL
2. Check that all functions are deployed (if applicable)
3. Test critical endpoints
4. Confirm no console errors

## MCP Functions to Use

### Get Deployment Status
```javascript
mcp_netlify_netlify-deploy-services-reader({
  selectSchema: {
    operation: "get-deploy",
    params: { deployId: "<deploy-id>" }
  }
})
```

### Get Deployment for Site
```javascript
mcp_netlify_netlify-deploy-services-reader({
  selectSchema: {
    operation: "get-deploy-for-site",
    params: { 
      siteId: "<site-id>",
      deployId: "<deploy-id>" 
    }
  }
})
```

### Deploy Site
```javascript
mcp_netlify_netlify-deploy-services-updater({
  selectSchema: {
    operation: "deploy-site",
    params: {
      siteId: "<site-id>",
      deployDirectory: "<absolute-path>"
    }
  }
})
```

## Deployment States

| State | Meaning | Action |
|-------|---------|--------|
| `enqueued` | Deployment queued | Wait 15s, check again |
| `building` | Currently building | Wait 30s, check again |
| `ready` | Deployment successful | ✅ Verify site access |
| `error` | Build failed | ❌ Check logs, fix issues |
| `preparing` | Preparing build | Wait 20s, check again |

## Monitoring Script Pattern

When I (the AI assistant) perform deployments, I will:

1. **After initiating deployment:**
   - Wait 30 seconds for Netlify to process
   - Start polling every 30 seconds

2. **During polling:**
   - Check deployment status
   - Log current state
   - If error detected, immediately investigate logs
   - Continue until "ready" or timeout (10 minutes)

3. **On success:**
   - Verify site URL is accessible
   - Report success with deployment URL

4. **On failure:**
   - Extract error details from logs
   - Provide specific error message
   - Suggest fixes based on error type

## Example Monitoring Flow

```
[Deploy Initiated]
  ↓
[Wait 30s]
  ↓
[Check Status: "building"]
  ↓
[Wait 30s]
  ↓
[Check Status: "building"]
  ↓
[Wait 30s]
  ↓
[Check Status: "ready"] ✅
  ↓
[Verify Site Access]
  ↓
[Report Success]
```

## Error Types & Solutions

### Build Errors
- **npm install failures**: Check package.json, dependencies
- **Build command errors**: Verify build command in netlify.toml
- **Missing environment variables**: Check Netlify dashboard env vars

### Function Errors
- **Function timeout**: Check function execution time
- **Import errors**: Verify function dependencies
- **Runtime errors**: Check function logs for stack traces

### Configuration Errors
- **netlify.toml syntax**: Validate TOML syntax
- **Redirect rules**: Check redirect patterns
- **Header configuration**: Verify header syntax

## Automatic Retry Logic

For transient errors (network issues, temporary build failures):
- Retry up to 3 times
- Wait 60 seconds between retries
- Only retry on specific error types (not configuration errors)

## Notes for AI Assistant

When performing deployments:
1. **Always** capture the deployId immediately after deployment
2. **Always** monitor until completion (ready or error)
3. **Always** check logs if status is "error"
4. **Always** verify site accessibility on success
5. **Never** assume deployment succeeded without checking
6. **Never** stop monitoring before "ready" or "error" state

## Integration with Git Deployments

If deployment is triggered via Git push:
1. Wait 30-60 seconds for Netlify to detect commit
2. Get latest deploy for site (may need to list deploys)
3. Use that deployId for monitoring
4. Follow same monitoring pattern


































