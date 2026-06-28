# Environment Variable Analysis Script
# Analyzes .env.production and identifies duplicates and unused variables

Write-Host "=== Environment Variable Analysis ===" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.production"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ $envFile not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Reading $envFile..." -ForegroundColor Yellow
$content = Get-Content $envFile -Raw

# Extract all environment variable names
$varPattern = '^([A-Z_]+)='
$vars = [System.Collections.ArrayList]::new()
$duplicates = [System.Collections.ArrayList]::new()

Get-Content $envFile | ForEach-Object {
    if ($_ -match $varPattern) {
        $varName = $matches[1]
        if ($vars -contains $varName) {
            if ($duplicates -notcontains $varName) {
                [void]$duplicates.Add($varName)
            }
        } else {
            [void]$vars.Add($varName)
        }
    }
}

Write-Host "✅ Found $($vars.Count) unique environment variables" -ForegroundColor Green
Write-Host ""

# Check for known duplicates
Write-Host "🔍 Checking for known duplicate patterns..." -ForegroundColor Yellow
Write-Host ""

$knownDuplicates = @{
    "SUPABASE_SERVICE_ROLE" = "SUPABASE_SERVICE_ROLE_KEY"
    "SUPABASE_ANON_KEY" = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_URL" = "NEXT_PUBLIC_SUPABASE_URL"
}

$foundDuplicates = @()

foreach ($key in $knownDuplicates.Keys) {
    if ($vars -contains $key -and $vars -contains $knownDuplicates[$key]) {
        $foundDuplicates += @{
            Old = $key
            New = $knownDuplicates[$key]
        }
        Write-Host "⚠️  DUPLICATE FOUND:" -ForegroundColor Yellow
        Write-Host "   - $key (older/legacy)" -ForegroundColor Red
        Write-Host "   - $($knownDuplicates[$key]) (preferred)" -ForegroundColor Green
        Write-Host ""
    }
}

if ($foundDuplicates.Count -eq 0) {
    Write-Host "✅ No known duplicates found!" -ForegroundColor Green
} else {
    Write-Host "📊 Summary: Found $($foundDuplicates.Count) duplicate pattern(s)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Analysis Complete ===" -ForegroundColor Cyan
