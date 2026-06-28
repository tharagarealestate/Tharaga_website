# Script to Verify Security Cleanup
# Checks for hardcoded secrets in codebase and git history

Write-Host "🔍 Security Cleanup Verification Script" -ForegroundColor Cyan
Write-Host "=======================================`n" -ForegroundColor Cyan

$issues = @()
$warnings = @()

# Known secrets that should not be in code
$secrets = @(
    "AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74",
    "hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=",
    "whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU",
    "re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6"
)

Write-Host "1. Checking codebase for hardcoded secrets..." -ForegroundColor Yellow

foreach ($secret in $secrets) {
    $pattern = [regex]::Escape($secret)
    $found = Get-ChildItem -Recurse -File -Exclude "*.git*", "node_modules", "*.md", ".env*" | 
        Select-String -Pattern $pattern -ErrorAction SilentlyContinue
    
    if ($found) {
        $secretPreview = if ($secret.Length -gt 20) { $secret.Substring(0, 20) } else { $secret }
        $issues += "Found secret in codebase: $($found.Filename)"
        Write-Host "   Found: $secretPreview..." -ForegroundColor Red
        $found | ForEach-Object { Write-Host "      File: $($_.Path):$($_.LineNumber)" -ForegroundColor Red }
    } else {
        Write-Host "   Not found in codebase" -ForegroundColor Green
    }
}

Write-Host "`n2. Checking git history for secrets..." -ForegroundColor Yellow

foreach ($secret in $secrets) {
    $gitResults = git log --all --full-history -S $secret --oneline 2>&1
    if ($gitResults -and $gitResults -notmatch "fatal") {
        $secretPreview = if ($secret.Length -gt 20) { $secret.Substring(0, 20) } else { $secret }
        $warnings += "Secret found in git history: $secretPreview"
        Write-Host "   Warning: Found in git history: $secretPreview..." -ForegroundColor Yellow
        Write-Host "      Run: git log --all --full-history -S '$secret'" -ForegroundColor Yellow
    } else {
        Write-Host "   Not found in git history" -ForegroundColor Green
    }
}

Write-Host "`n3. Checking .env.production..." -ForegroundColor Yellow

if (Test-Path ".env.production") {
    Write-Host "   ✅ .env.production exists" -ForegroundColor Green
    
    # Check if it's in .gitignore
    $gitignore = Get-Content ".gitignore" -ErrorAction SilentlyContinue
    if ($gitignore -match "\.env\.production") {
        Write-Host "   ✅ .env.production is in .gitignore" -ForegroundColor Green
    } else {
        $issues += ".env.production is NOT in .gitignore"
        Write-Host "   ❌ .env.production is NOT in .gitignore!" -ForegroundColor Red
    }
    
    # Check for placeholder values
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "YOUR_.*_HERE|your-.*-here") {
        $warnings += ".env.production contains placeholder values that need to be replaced"
        Write-Host "   ⚠️  Contains placeholder values (may need updates)" -ForegroundColor Yellow
    }
} else {
    $issues += ".env.production file not found"
    Write-Host "   ❌ .env.production not found!" -ForegroundColor Red
}

Write-Host "`n4. Checking app/.env.production..." -ForegroundColor Yellow

if (Test-Path "app/.env.production") {
    $warnings += "app/.env.production still exists (should be consolidated into root)"
    Write-Host "   ⚠️  app/.env.production still exists (should be deleted)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ app/.env.production does not exist (consolidated)" -ForegroundColor Green
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "`n✅ All checks passed! Codebase is clean." -ForegroundColor Green
} else {
    if ($issues.Count -gt 0) {
        Write-Host "`n❌ Issues found ($($issues.Count)):" -ForegroundColor Red
        $issues | ForEach-Object { Write-Host "   • $_" -ForegroundColor Red }
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "`n⚠️  Warnings ($($warnings.Count)):" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host "   • $_" -ForegroundColor Yellow }
    }
}

Write-Host ""

