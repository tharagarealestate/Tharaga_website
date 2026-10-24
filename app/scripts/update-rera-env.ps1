# Script to update .env.production with RERA configuration
$envFile = ".env.production"
$reraConfig = @"

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
# Generated: $(Get-Date -Format "yyyy-MM-dd")
RERA_MONITOR_API_KEY=qYofRsFAXnbNhAk8odyASeTym5cfmx/SKabs4QA1wgE=

"@

# Check if file exists
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    
    # Remove existing RERA config if present
    $content = $content -replace '(?s)# =====================================================.*?RERA_MONITOR_API_KEY=.*?\n', ''
    $content = $content -replace 'USE_SYNTHETIC_RERA=.*?\n', ''
    $content = $content -replace 'RERA_PARTNER_API_URL=.*?\n', ''
    $content = $content -replace 'RERA_PARTNER_API_KEY=.*?\n', ''
    $content = $content -replace 'RERA_MONITOR_API_KEY=.*?\n', ''
    
    # Add new RERA config
    $content += "`n" + $reraConfig
    
    Set-Content -Path $envFile -Value $content -NoNewline
    Write-Host "✅ Updated .env.production with RERA configuration"
} else {
    # Create new file
    Set-Content -Path $envFile -Value $reraConfig
    Write-Host "✅ Created .env.production with RERA configuration"
}

Write-Host "`nRERA Environment Variables:"
Write-Host "- USE_SYNTHETIC_RERA=true (set to false for production)"
Write-Host "- RERA_PARTNER_API_URL (internal service)"
Write-Host "- RERA_PARTNER_API_KEY (internal key)"
Write-Host "- RERA_MONITOR_API_KEY (generated)"



