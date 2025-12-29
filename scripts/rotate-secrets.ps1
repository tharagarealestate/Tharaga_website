# Script to Generate New Secrets and Update .env.production
# This script generates new secrets for keys that need rotation

Write-Host "🔐 Secret Rotation Helper Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$envFile = ".env.production"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ Error: .env.production not found!" -ForegroundColor Red
    exit 1
}

$content = Get-Content $envFile -Raw

# Generate new secrets
Write-Host "Generating new secrets..." -ForegroundColor Yellow

# Generate new CRON_SECRET (base64, 32 bytes = 256 bits)
$bytes1 = New-Object byte[] 32
$bytes2 = New-Object byte[] 32
$bytes3 = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes1)
$rng.GetBytes($bytes2)
$rng.GetBytes($bytes3)
$newCronSecret = [Convert]::ToBase64String($bytes1)
$newCronSecretEmail = [Convert]::ToBase64String($bytes2)

# Generate new RERA Monitor API Key
$newReraMonitorKey = [Convert]::ToBase64String($bytes3)

Write-Host "`n✅ Generated new secrets:" -ForegroundColor Green
Write-Host "   - New CRON_SECRET: $($newCronSecret.Substring(0, 20))..." -ForegroundColor White
Write-Host "   - New CRON_SECRET_EMAIL_AUTOMATION: $($newCronSecretEmail.Substring(0, 20))..." -ForegroundColor White
Write-Host "   - New RERA_MONITOR_API_KEY: $($newReraMonitorKey.Substring(0, 20))..." -ForegroundColor White

# Create backup
$backupFile = ".env.production.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $envFile $backupFile
Write-Host "`n✅ Created backup: $backupFile" -ForegroundColor Green

# Update .env.production with placeholders for keys that need manual rotation
Write-Host "`n⚠️  Keys that need manual rotation (update in service dashboards):" -ForegroundColor Yellow

$updates = @{
    # Keys that can be auto-generated
    "CRON_SECRET=6d995a138f9cc817e14ccf75bb8cd817c19f4e44db59a9a65cfd9fcc751bba4a" = "CRON_SECRET=$newCronSecret"
    "CRON_SECRET_EMAIL_AUTOMATION=hdN8SGSEsSulptdqHg0O2Yss2lpxXwKUlDvMZM3ABso=" = "CRON_SECRET_EMAIL_AUTOMATION=$newCronSecretEmail"
    
    # Keys that need manual rotation (add placeholder comments)
    "NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74" = "# ⚠️ ROTATE THIS KEY - Was exposed in git history`n# Get new key from: https://console.cloud.google.com/apis/credentials`nNEXT_PUBLIC_GOOGLE_MAPS_KEY=YOUR_NEW_GOOGLE_MAPS_KEY_HERE"
    "FIREBASE_API_KEY=AIzaSyAUNl5bZif51a8b5FC5kKqZs40KlP5lP74" = "# ⚠️ ROTATE THIS KEY - Was exposed in git history`n# Get new key from: https://console.firebase.google.com/project/tharaga-n/settings/general`nFIREBASE_API_KEY=YOUR_NEW_FIREBASE_KEY_HERE"
    "RESEND_API_KEY=re_H9TCXTNw_LDFKwRKd92qow9MNng5adhH6" = "# ⚠️ ROTATE THIS KEY - Was exposed in git history`n# Get new key from: https://resend.com/api-keys`nRESEND_API_KEY=YOUR_NEW_RESEND_API_KEY_HERE"
    "RESEND_WEBHOOK_SECRET_ALT=whsec_b2akJsaEFVZl8i6fKAnztSqHxqIEi/cU" = "# ⚠️ ROTATE THIS KEY - Was exposed in git history`n# Get new secret from: https://resend.com/webhooks`nRESEND_WEBHOOK_SECRET_ALT=YOUR_NEW_WEBHOOK_SECRET_HERE"
}

$updatedContent = $content
foreach ($old in $updates.Keys) {
    if ($updatedContent -match [regex]::Escape($old)) {
        $updatedContent = $updatedContent -replace [regex]::Escape($old), $updates[$old]
        Write-Host "   ✅ Updated: $($old.Substring(0, [Math]::Min(50, $old.Length)))..." -ForegroundColor Green
    }
}

# Write updated content
Set-Content -Path $envFile -Value $updatedContent -NoNewline

Write-Host "`n✅ Updated .env.production with new secrets" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Manually rotate these keys in their dashboards:" -ForegroundColor Yellow
Write-Host "      - Google Maps API Key: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "      - Firebase API Key: https://console.firebase.google.com/project/tharaga-n/settings/general" -ForegroundColor White
Write-Host "      - Resend API Key: https://resend.com/api-keys" -ForegroundColor White
Write-Host "      - Resend Webhook Secret: https://resend.com/webhooks" -ForegroundColor White
Write-Host "   2. Replace the placeholders in .env.production with actual new keys" -ForegroundColor White
Write-Host "   3. Update deployment platforms (Netlify/Vercel) with new values" -ForegroundColor White
Write-Host "`n💾 Backup saved to: $backupFile" -ForegroundColor Cyan

