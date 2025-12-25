# PowerShell script to add RERA environment variables to Netlify
# Requires: netlify-cli installed globally (npm install -g netlify-cli)
# Usage: .\scripts\add-netlify-env-vars.ps1

Write-Host "=== Netlify Environment Variables Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if netlify CLI is installed
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
if (-not $netlifyInstalled) {
    Write-Host "❌ Netlify CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g netlify-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Netlify CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Netlify login status..." -ForegroundColor Cyan
$loginStatus = netlify status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Not logged in to Netlify" -ForegroundColor Yellow
    Write-Host "Please run: netlify login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Logged in to Netlify" -ForegroundColor Green
Write-Host ""

# RERA Environment Variables
$envVars = @{
    "USE_SYNTHETIC_RERA" = "false"
    "RERA_PARTNER_API_URL" = "https://wedevtjjmdvngyshqdro.supabase.co/functions/v1/rera-partner"
    "RERA_PARTNER_API_KEY" = "HIW5l7wuvmFz6bYo1kV3V2KBi85r+fTd1W1nKbNIYMI="
    "RERA_MONITOR_API_KEY" = "qYofRsFAXnbNhAk8odyASeTym5cfmx/SKabs4QA1wgE="
    "SUPABASE_SERVICE_ROLE_KEY" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ3NjAzOCwiZXhwIjoyMDcxMDUyMDM4fQ.mt_-4ySbCBm4s0t-zYnM46OspcsAEwddgNepzw6KUmU"
    "SUPABASE_SERVICE_ROLE" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ3NjAzOCwiZXhwIjoyMDcxMDUyMDM4fQ.mt_-4ySbCBm4s0t-zYnM46OspcsAEwddgNepzw6KUmU"
}

Write-Host "Adding environment variables to Netlify..." -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-Host "Setting $key..." -ForegroundColor Yellow -NoNewline
    
    # Use --scope flag for production environment
    $result = netlify env:set "$key" "$value" --scope production 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host " ✗" -ForegroundColor Red
        Write-Host "  Error: $result" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "✓ Successfully added: $successCount variables" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "✗ Failed: $failCount variables" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify variables in Netlify Dashboard → Site Settings → Environment Variables" -ForegroundColor Yellow
Write-Host "2. Trigger a new deployment or retry the failed deployment" -ForegroundColor Yellow
Write-Host "3. Check deployment logs to ensure build succeeds" -ForegroundColor Yellow

