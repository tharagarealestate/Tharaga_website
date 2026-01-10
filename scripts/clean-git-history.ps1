# Script to Clean Secrets from Git History
# ⚠️ WARNING: This script rewrites git history. Use with caution!

Write-Host "🧹 Git History Cleanup Script" -ForegroundColor Cyan
Write-Host "=============================`n" -ForegroundColor Cyan

Write-Host "⚠️  WARNING: This script will rewrite git history!" -ForegroundColor Red
Write-Host "   - All team members will need to re-clone the repository" -ForegroundColor Yellow
Write-Host "   - This is a destructive operation" -ForegroundColor Yellow
Write-Host "   - Coordinate with your team before proceeding`n" -ForegroundColor Yellow

$confirm = Read-Host "Are you sure you want to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "`n❌ Operation cancelled" -ForegroundColor Red
    exit 0
}

# Check if git-filter-repo is installed
$hasFilterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue

if (-not $hasFilterRepo) {
    Write-Host "`n❌ git-filter-repo is not installed" -ForegroundColor Red
    Write-Host "`nInstall it using one of these methods:" -ForegroundColor Yellow
    Write-Host "   Windows: pip install git-filter-repo" -ForegroundColor White
    Write-Host "   Mac: brew install git-filter-repo" -ForegroundColor White
    Write-Host "   Linux: pip install git-filter-repo" -ForegroundColor White
    Write-Host "`nOr use BFG Repo-Cleaner instead (see REMOVE_SECRETS_FROM_GIT_HISTORY.md)" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n✅ git-filter-repo found" -ForegroundColor Green

# Create backup branch
$backupBranch = "backup-before-history-cleanup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "`n📦 Creating backup branch: $backupBranch" -ForegroundColor Yellow
git branch $backupBranch
Write-Host "✅ Backup branch created" -ForegroundColor Green

# Secrets to remove
$secrets = @(
    "AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74",
    "hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=",
    "whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU",
    "re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6"
)

Write-Host "`n🔍 Removing secrets from git history..." -ForegroundColor Yellow

foreach ($secret in $secrets) {
    Write-Host "   Removing: $($secret.Substring(0, [Math]::Min(20, $secret.Length)))..." -ForegroundColor White
    
    # Create replacement file
    $replacementFile = [System.IO.Path]::GetTempFileName()
    "$secret==>REMOVED_SECRET" | Out-File -FilePath $replacementFile -NoNewline
    
    try {
        git filter-repo --replace-text $replacementFile --force 2>&1 | Out-Null
        Write-Host "   ✅ Removed" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Error removing secret: $_" -ForegroundColor Red
    } finally {
        Remove-Item $replacementFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n✅ Git history cleanup complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review changes: git log --oneline" -ForegroundColor White
Write-Host "   2. Force push to remote: git push origin --force --all" -ForegroundColor White
Write-Host "   3. Notify team members to re-clone the repository" -ForegroundColor White
Write-Host "   4. Backup branch available: $backupBranch" -ForegroundColor White
Write-Host "`n⚠️  Remember to coordinate with your team before force pushing!" -ForegroundColor Yellow




























































