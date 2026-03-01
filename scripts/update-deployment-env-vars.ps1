# Script to Generate Environment Variables for Deployment Platforms
# This script reads .env.production and generates commands/instructions for updating deployment platforms

Write-Host "🚀 Deployment Platform Environment Variables Helper" -ForegroundColor Cyan
Write-Host "===================================================`n" -ForegroundColor Cyan

$envFile = ".env.production"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env.production not found!" -ForegroundColor Red
    exit 1
}

# Read .env.production
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.+)$' -and $_ -notmatch '^\s*#') {
        $key = $matches[1]
        $value = $matches[2].Trim()
        if ($value -and $value -notmatch '^YOUR_.*_HERE$' -and $value -notmatch '^your-.*-here') {
            $envVars[$key] = $value
        }
    }
}

Write-Host "📋 Found $($envVars.Count) environment variables`n" -ForegroundColor Green

# Generate Netlify CLI commands
Write-Host "🌐 Netlify Environment Variables:" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow
Write-Host "`n# Netlify CLI Commands (run from project root):" -ForegroundColor Cyan

$netlifyCommands = @()
foreach ($key in $envVars.Keys | Sort-Object) {
    $value = $envVars[$key]
    $netlifyCommands += "netlify env:set $key `"$value`" --context production"
}

$netlifyCommands | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

# Generate Netlify Dashboard instructions
Write-Host "`n# Or update via Netlify Dashboard:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://app.netlify.com/sites/[your-site]/configuration/env" -ForegroundColor White
Write-Host "   2. Add each variable below manually" -ForegroundColor White

Write-Host "`n# Netlify Environment Variables (copy to dashboard):" -ForegroundColor Cyan
foreach ($key in $envVars.Keys | Sort-Object) {
    $value = $envVars[$key]
    Write-Host "   $key=$value" -ForegroundColor White
}

# Generate Vercel CLI commands
Write-Host "`n`n▲ Vercel Environment Variables:" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow
Write-Host "`n# Vercel CLI Commands (run from project root):" -ForegroundColor Cyan

$vercelCommands = @()
foreach ($key in $envVars.Keys | Sort-Object) {
    $value = $envVars[$key]
    $vercelCommands += "echo `"$value`" | vercel env add $key production"
}

$vercelCommands | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

Write-Host "`n# Or update via Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "   1. Go to: https://vercel.com/[your-team]/[your-project]/settings/environment-variables" -ForegroundColor White
Write-Host "   2. Add each variable for Production environment" -ForegroundColor White

# Generate JSON format for easy copy-paste
Write-Host "`n`n📄 JSON Format (for API/automation):" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
$json = @{}
foreach ($key in $envVars.Keys | Sort-Object) {
    $json[$key] = $envVars[$key]
}
$json | ConvertTo-Json | Write-Host -ForegroundColor White

# Save to file
$outputFile = "deployment-env-vars-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
$output = @"
# Environment Variables for Deployment Platforms
# Generated: $(Get-Date)

## Netlify CLI Commands:
$($netlifyCommands -join "`n")

## Netlify Dashboard Variables:
$($envVars.Keys | Sort-Object | ForEach-Object { "$_=$($envVars[$_])" } | ForEach-Object { "  $_" } | Out-String)

## Vercel CLI Commands:
$($vercelCommands -join "`n")

## JSON Format:
$($json | ConvertTo-Json)
"@

Set-Content -Path $outputFile -Value $output
Write-Host ""
Write-Host "Saved to: $outputFile" -ForegroundColor Green

