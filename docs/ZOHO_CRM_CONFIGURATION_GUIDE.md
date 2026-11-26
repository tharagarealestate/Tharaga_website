# Zoho CRM Integration Configuration Guide

This guide will help you configure Zoho CRM integration for your Tharaga builder dashboard.

## Prerequisites

1. A Zoho CRM account (free or paid)
2. Access to your Zoho Developer Console
3. Admin access to your Netlify deployment settings

## Step 1: Create a Zoho CRM Application

1. **Go to Zoho Developer Console**
   - Visit: https://api-console.zoho.com/
   - Sign in with your Zoho account

2. **Create a New Client**
   - Click on "Add Client"
   - Choose "Server-based Applications"
   - Fill in the following details:
     - **Client Name**: Tharaga Builder Dashboard (or any name you prefer)
     - **Homepage URL**: `https://your-app-url.com` (your Netlify site URL)
     - **Authorized Redirect URIs**: 
       ```
       https://your-app-url.com/api/integrations/zoho/oauth
       ```
       ⚠️ **Important**: Replace `your-app-url.com` with your actual Netlify domain (e.g., `lucky-cobbler-077ec9.netlify.app`)
     - **Scope**: 
       ```
       ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ
       ```

3. **Save and Get Credentials**
   - After creating the client, you'll receive:
     - **Client ID** (also called Client Identifier)
     - **Client Secret** (also called Client Secret)
   - ⚠️ **Save these securely** - you'll need them in the next step

## Step 2: Identify Your Zoho Data Center

Zoho CRM is hosted in different data centers. You need to know which one your account uses:

- **United States**: `.com` (accounts.zoho.com)
- **Europe**: `.eu` (accounts.zoho.eu)
- **India**: `.in` (accounts.zoho.in) - **Most common for Indian accounts**
- **Australia**: `.com.au` (accounts.zoho.com.au)
- **Japan**: `.jp` (accounts.zoho.jp)

**How to check your data center:**
- Look at your Zoho CRM login URL
- If you login at `crm.zoho.in`, your data center is `in`
- If you login at `crm.zoho.com`, your data center is `com`
- The integration UI will let you select your data center during connection

## Step 3: Set Environment Variables in Netlify

1. **Go to Netlify Dashboard**
   - Navigate to your site
   - Go to **Site Settings** → **Environment Variables**

2. **Add the following variables:**

   ```
   ZOHO_CLIENT_ID=your_client_id_here
   ZOHO_CLIENT_SECRET=your_client_secret_here
   ZOHO_REDIRECT_URI=https://your-app-url.com/api/integrations/zoho/oauth
   NEXT_PUBLIC_APP_URL=https://your-app-url.com
   ```

   ⚠️ **Important Notes:**
   - Replace `your_client_id_here` with your actual Client ID from Step 1
   - Replace `your_client_secret_here` with your actual Client Secret from Step 1
   - Replace `your-app-url.com` with your actual Netlify domain
   - Make sure `ZOHO_REDIRECT_URI` exactly matches the redirect URI you set in Zoho Developer Console
   - `NEXT_PUBLIC_APP_URL` should be your base application URL (without trailing slash)

3. **Optional Variables** (if you have specific requirements):
   ```
   ZOHO_ACCOUNTS_URL=https://accounts.zoho.in  # Optional, defaults based on data center
   ZOHO_API_DOMAIN=https://www.zohoapis.in      # Optional, defaults based on data center
   ZOHO_SCOPE=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.READ  # Optional
   ```

4. **Redeploy Your Application**
   - After adding environment variables, trigger a new deployment
   - Environment variables are only available in new builds

## Step 4: Connect Zoho CRM in Your Dashboard

1. **Navigate to Integrations Page**
   - Go to your builder dashboard
   - Click on **Integrations** in the sidebar
   - Find the **Zoho CRM** card

2. **Select Your Data Center**
   - Click on the Zoho CRM card
   - Select your data center from the dropdown (e.g., "India (.in)")
   - Click **"Connect Zoho CRM"**

3. **Authorize Access**
   - You'll be redirected to Zoho's authorization page
   - Sign in with your Zoho account
   - Review the permissions requested
   - Click **"Accept"** to authorize

4. **Verify Connection**
   - After authorization, you'll be redirected back to your dashboard
   - The Zoho CRM card should now show **"Connected"** status
   - You should see your account email and organization details

## Step 5: Test the Integration

1. **Check Connection Status**
   - Go to **Integrations** → **Zoho CRM**
   - Verify that your account is listed
   - Check that the connection status is "Active"

2. **Sync a Lead**
   - Go to your **Leads** page
   - Create or select a lead
   - The lead should automatically sync to Zoho CRM (if auto-sync is enabled)
   - Or manually trigger a sync from the integrations page

3. **Verify in Zoho CRM**
   - Log in to your Zoho CRM account
   - Go to **Contacts** or **Leads** module
   - Verify that your test lead appears there

## Troubleshooting

### Error: "Zoho CRM integration is not fully configured"

**Cause**: Missing environment variables

**Solution**:
1. Verify all required environment variables are set in Netlify
2. Ensure there are no typos in variable names
3. Make sure `NEXT_PUBLIC_APP_URL` matches your actual domain
4. Redeploy after adding/updating environment variables

### Error: "Invalid redirect URI" or "redirect_uri_mismatch"

**Cause**: Redirect URI mismatch between Zoho Developer Console and environment variables

**Solution**:
1. Check that `ZOHO_REDIRECT_URI` in Netlify exactly matches the redirect URI in Zoho Developer Console
2. Make sure there are no trailing slashes
3. Ensure you're using the correct protocol (https)
4. Verify the domain matches exactly (including subdomain)

### Error: "Connection failed" during OAuth

**Cause**: Wrong data center selected or network issues

**Solution**:
1. Verify you've selected the correct data center (check your Zoho login URL)
2. Try disconnecting and reconnecting
3. Check your browser console for detailed error messages
4. Verify that `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` are correct

### Error: "Token refresh failed" or "Authentication failed"

**Cause**: Invalid credentials or expired connection

**Solution**:
1. Disconnect and reconnect Zoho CRM
2. Verify your `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` are still valid
3. Check that your Zoho account is active
4. Re-authorize the application in Zoho

### Leads Not Syncing

**Cause**: Sync not configured or failed

**Solution**:
1. Go to Integrations → Zoho CRM
2. Check sync logs for any errors
3. Try a manual sync by clicking "Sync Now"
4. Verify that leads exist in your Tharaga dashboard
5. Check that field mappings are configured correctly

## Field Mappings

The integration automatically maps Tharaga fields to Zoho CRM fields:

**Lead/Contact Mappings:**
- `name` → `Last_Name`
- `email` → `Email`
- `phone` → `Phone`
- `source` → `Lead_Source`
- `budget` → `Budget`
- `ai_lead_score` → `Rating`
- `status` → `Lead_Status`

**Deal Mappings:**
- `property_id` → `Deal_Name`
- `price` → `Amount`
- `status` → `Stage`
- `expected_close_date` → `Closing_Date`

These mappings are stored in the `crm_field_mappings` table and can be customized if needed.

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Check Netlify function logs for server-side errors
3. Verify all environment variables are set correctly
4. Ensure your Zoho account has the necessary permissions
5. Try disconnecting and reconnecting the integration

## Security Notes

- ⚠️ **Never commit** your `ZOHO_CLIENT_SECRET` to version control
- ✅ Environment variables in Netlify are encrypted at rest
- ✅ OAuth tokens are stored securely in the database
- ✅ The integration uses HTTPS for all API calls
- ✅ Token refresh is handled automatically

## Additional Resources

- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/v2/overview.html)
- [Zoho OAuth Guide](https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html)
- [Zoho Data Centers](https://www.zoho.com/crm/help/api/v2/#data-center)

