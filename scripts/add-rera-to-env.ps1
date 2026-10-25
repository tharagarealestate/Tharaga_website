# Add RERA environment variables to root .env.production
$envFile = Join-Path $PSScriptRoot ".." ".env.production"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env.production not found in root directory" -ForegroundColor Red
    exit 1
}

# RERA variables to add
$reraVars = @"

# RERA Verification System Configuration
USE_SYNTHETIC_RERA=false
RERA_PARTNER_API_URL=https://wedevtjjmdvngyshqdro.supabase.co/functions/v1/rera-partner
RERA_PARTNER_API_KEY=HIW5l7wuvmFz6bYo1kV3V2KBi85r+fTd1W1nKbNIYMI=
RERA_MONITOR_API_KEY=qYofRsFAXnbNhAk8odyASeTym5cfmx/SKabs4QA1wgE=

# Supabase Service Role Key (alternative name for SUPABASE_SERVICE_ROLE)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGV2dGpqbWR2bmd5c2hxZHJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ3NjAzOCwiZXhwIjoyMDcxMDUyMDM4fQ.mt_-4ySbCBm4s0t-zYnM46OspcsAEwddgNepzw6KUmU
"@

# Read existing content
$content = Get-Content $envFile -Raw

# Check if RERA vars already exist
if ($content -match "RERA_PARTNER_API_KEY") {
    Write-Host "RERA variables already exist in .env.production" -ForegroundColor Yellow
    exit 0
}

# Append RERA variables
$newContent = $content.TrimEnd() + $reraVars
Set-Content $envFile -Value $newContent -NoNewline

Write-Host "✓ Successfully added RERA environment variables to root .env.production" -ForegroundColor Green

# Verify
Write-Host "`n=== Verification ===" -ForegroundColor Cyan
Get-Content $envFile | Select-String -Pattern "RERA" | ForEach-Object {
    Write-Host $_ -ForegroundColor Green
}
Get-Content $envFile | Select-String -Pattern "USE_SYNTHETIC" | ForEach-Object {
    Write-Host $_ -ForegroundColor Green
}
Get-Content $envFile | Select-String -Pattern "SUPABASE_SERVICE_ROLE_KEY" | ForEach-Object {
    Write-Host $_ -ForegroundColor Green
}

