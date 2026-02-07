# Analyze environment variable usage across the codebase
# This script extracts all unique environment variables and categorizes them

$envVars = @{}

# Search in app directory
$appFiles = Get-ChildItem -Path "app" -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.mjs -ErrorAction SilentlyContinue
foreach ($file in $appFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $matches = [regex]::Matches($content, 'process\.env\.([A-Z_][A-Z0-9_]*)')
        foreach ($match in $matches) {
            $varName = $match.Groups[1].Value
            if (-not $envVars.ContainsKey($varName)) {
                $envVars[$varName] = @{
                    Count = 0
                    Files = @()
                    Type = if ($varName -like "NEXT_PUBLIC_*") { "CLIENT" } else { "SERVER" }
                }
            }
            $envVars[$varName].Count++
            if ($envVars[$varName].Files.Count -lt 5) {
                $envVars[$varName].Files += $file.Name
            }
        }
    }
}

# Search in netlify/functions directory
$functionFiles = Get-ChildItem -Path "netlify/functions" -Recurse -Include *.js,*.mjs -ErrorAction SilentlyContinue
foreach ($file in $functionFiles) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        $matches = [regex]::Matches($content, 'process\.env\.([A-Z_][A-Z0-9_]*)')
        foreach ($match in $matches) {
            $varName = $match.Groups[1].Value
            if (-not $envVars.ContainsKey($varName)) {
                $envVars[$varName] = @{
                    Count = 0
                    Files = @()
                    Type = "FUNCTION"
                }
            }
            $envVars[$varName].Count++
            if ($envVars[$varName].Type -eq "FUNCTION") {
                if ($envVars[$varName].Files.Count -lt 5) {
                    $envVars[$varName].Files += $file.Name
                }
            }
        }
    }
}

# Output results
Write-Host "=== ENVIRONMENT VARIABLES USED IN CODEBASE ===" -ForegroundColor Cyan
Write-Host "Total unique variables: $($envVars.Count)`n" -ForegroundColor Yellow

$clientVars = $envVars.GetEnumerator() | Where-Object { $_.Value.Type -eq "CLIENT" } | Sort-Object Name
$serverVars = $envVars.GetEnumerator() | Where-Object { $_.Value.Type -eq "SERVER" } | Sort-Object Name
$functionVars = $envVars.GetEnumerator() | Where-Object { $_.Value.Type -eq "FUNCTION" } | Sort-Object Name

Write-Host "CLIENT-SIDE (NEXT_PUBLIC_*): $($clientVars.Count)" -ForegroundColor Green
$clientVars | ForEach-Object { Write-Host "  - $($_.Name) (used $($_.Value.Count) times)" }

Write-Host "`nSERVER-SIDE: $($serverVars.Count)" -ForegroundColor Green
$serverVars | ForEach-Object { Write-Host "  - $($_.Name) (used $($_.Value.Count) times)" }

Write-Host "`nNETLIFY FUNCTIONS: $($functionVars.Count)" -ForegroundColor Green
$functionVars | ForEach-Object { Write-Host "  - $($_.Name) (used $($_.Value.Count) times)" }

# Export to JSON for further analysis
$envVars | ConvertTo-Json -Depth 3 | Out-File "env-usage-analysis.json" -Encoding UTF8
Write-Host "`nDetailed analysis saved to: env-usage-analysis.json" -ForegroundColor Cyan
