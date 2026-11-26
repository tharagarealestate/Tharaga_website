# Script to add all required RERA and Supabase environment variables to .env.production
# Run this from the app directory: .\scripts\add-all-env-vars.ps1

$envFile = ".env.production"

Write-Host "🔧 Updating .env.production with all required environment variables..." -ForegroundColor Cyan

# Read existing file
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
} else {
    $content = ""
}

# Remove duplicates and old RERA config if exists
$content = $content -replace '(?s)# =====================================================.*?RERA_MONITOR_API_KEY=.*?\n', ''
$content = $content -replace 'USE_SYNTHETIC_RERA=.*?\n', ''
$content = $content -replace 'RERA_PARTNER_API_URL=.*?\n', ''
$content = $content -replace 'RERA_PARTNER_API_KEY=.*?\n', ''
$content = $content -replace 'RERA_MONITOR_API_KEY=.*?\n', ''
$content = $content -replace 'SUPABASE_SERVICE_ROLE_KEY=.*?\n', ''
$content = $content -replace 'SUPABASE_SERVICE_ROLE=.*?\n', ''

# Remove duplicate NEXT_PUBLIC_SUPABASE entries (keep only first occurrence)
$lines = $content -split "`n"
$seenUrl = $false
$seenKey = $false
$cleanedLines = @()

foreach ($line in $lines) {
    if ($line -match '^NEXT_PUBLIC_SUPABASE_URL=') {
        if (-not $seenUrl) {
            $cleanedLines += $line
            $seenUrl = $true
        }
    } elseif ($line -match '^NEXT_PUBLIC_SUPABASE_ANON_KEY=') {
        if (-not $seenKey) {
            $cleanedLines += $line
            $seenKey = $true
        }
    } else {
        $cleanedLines += $line
    }
}

$content = $cleanedLines -join "`n"

# Add Supabase Service Role Key section (if not present)
if ($content -notmatch 'SUPABASE_SERVICE_ROLE_KEY') {
    $supabaseServiceRole = @'
# Supabase Service Role Key (for server-side operations)
# IMPORTANT: Get this from: https://app.supabase.com/project/wedevtjjmdvngyshqdro/settings/api
# Look for the service_role key (secret key with full database access)
# Keep this secret! Never commit to git or expose publicly.
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here

# Alternative Supabase URL (for backward compatibility)
SUPABASE_URL=https://wedevtjjmdvngyshqdro.supabase.co

'@
    $content = $content + "`n" + $supabaseServiceRole
}

# Add RERA configuration
$reraConfig = @'
# =====================================================
# RERA Verification System Configuration
# =====================================================

# Enable/disable synthetic RERA data (set to false for real scraping)
USE_SYNTHETIC_RERA=true

# Internal RERA Partner API (our own service - no external dependency)
# This uses our own internal aggregation service
RERA_PARTNER_API_URL=https://wedevtjjmdvngyshqdro.supabase.co/functions/v1/rera-partner
RERA_PARTNER_API_KEY=internal-service-key

# RERA Monitor API Key (for securing monitoring endpoint)
# Generated secure key for /api/rera/monitor endpoint
RERA_MONITOR_API_KEY=qYofRsFAXnbNhAk8odyASeTym5cfmx/SKabs4QA1wgE=

'@

$content = $content + "`n" + $reraConfig

# Write to file
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "✅ Updated .env.production successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Environment Variables Added:" -ForegroundColor Yellow
Write-Host "  ✅ USE_SYNTHETIC_RERA" -ForegroundColor Green
Write-Host "  ✅ RERA_PARTNER_API_URL" -ForegroundColor Green
Write-Host "  ✅ RERA_PARTNER_API_KEY" -ForegroundColor Green
Write-Host "  ✅ RERA_MONITOR_API_KEY" -ForegroundColor Green
Write-Host "  ✅ SUPABASE_SERVICE_ROLE_KEY (placeholder - needs actual key)" -ForegroundColor Yellow
Write-Host "  ✅ SUPABASE_SERVICE_ROLE (placeholder - needs actual key)" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ACTION REQUIRED:" -ForegroundColor Red
Write-Host "  1. Get your Supabase Service Role Key from:" -ForegroundColor Yellow
Write-Host "     https://app.supabase.com/project/wedevtjjmdvngyshqdro/settings/api" -ForegroundColor Cyan
Write-Host "  2. Replace 'your-service-role-key-here' in .env.production with the actual key" -ForegroundColor Yellow
Write-Host ""

