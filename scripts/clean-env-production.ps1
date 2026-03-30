# Clean .env.production based on minimal template
# This script removes variables NOT in the minimal list

# Define minimal variables (from .env.production.minimal template)
$minimalVars = @(
    # Client-side
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_GOOGLE_MAPS_KEY',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'NEXT_PUBLIC_ADMIN_TOKEN',
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    # Supabase
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    # Resend
    'RESEND_API_KEY',
    'RESEND_FROM_EMAIL',
    'RESEND_FROM_NAME',
    'RESEND_WEBHOOK_SECRET',
    # Razorpay
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'RZP_PLAN_STARTER_MONTHLY',
    'RZP_PLAN_STARTER_ANNUAL',
    'RZP_PLAN_PROFESSIONAL_MONTHLY',
    'RZP_PLAN_PROFESSIONAL_ANNUAL',
    'RZP_PLAN_ENTERPRISE_MONTHLY',
    'RZP_PLAN_ENTERPRISE_ANNUAL',
    # Stripe (optional)
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    # Twilio
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'TWILIO_PHONE_NUMBER_SID',
    'TWILIO_WEBHOOK_URL',
    'TWILIO_WHATSAPP_NUMBER',
    # Zoho
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET',
    'ZOHO_REDIRECT_URI',
    # Google
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'DEFAULT_CALENDAR_ID',
    'DEFAULT_TIMEZONE',
    # AI
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    # RERA
    'RERA_MONITOR_API_KEY',
    'RERA_PARTNER_API_KEY',
    'RERA_PARTNER_API_URL',
    'USE_SYNTHETIC_RERA',
    # VAPID
    'VAPID_PRIVATE_KEY',
    'VAPID_PUBLIC_KEY',
    # Admin
    'ADMIN_EMAIL',
    'ADMIN_TOKEN',
    'CRON_SECRET',
    'ENCRYPTION_KEY',
    'ENCRYPTION_KEY_ROTATION_DAYS',
    'INTERNAL_API_KEY',
    # Automation
    'NEWSLETTER_AUTOMATION_API_KEY',
    'ZENROWS_API_KEY'
)

# Read .env.production
$envFile = '.env.production'
if (-not (Test-Path $envFile)) {
    Write-Host "Error: $envFile not found!" -ForegroundColor Red
    exit 1
}

# Create backup
$backupFile = "$envFile.backup"
if (-not (Test-Path $backupFile)) {
    Copy-Item $envFile $backupFile
    Write-Host "Backup created: $backupFile" -ForegroundColor Green
}

# Read and process file
$lines = Get-Content $envFile
$cleaned = @()
$removed = @()
$kept = @()

foreach ($line in $lines) {
    # Keep comments and empty lines
    if ($line -match '^\s*#' -or $line.Trim() -eq '') {
        $cleaned += $line
        continue
    }
    
    # Check if it's a variable assignment
    if ($line -match '^([A-Z_][A-Z0-9_]*)=') {
        $varName = $matches[1]
        
        if ($minimalVars -contains $varName) {
            $cleaned += $line
            $kept += $varName
        } else {
            $removed += $varName
        }
    } else {
        # Keep other lines (might be malformed, but preserve them)
        $cleaned += $line
    }
}

# Write cleaned file
$cleaned | Out-File -FilePath $envFile -Encoding UTF8 -NoNewline

# Report
Write-Host "`n=== Cleanup Summary ===" -ForegroundColor Cyan
Write-Host "Variables KEPT: $($kept.Count)" -ForegroundColor Green
Write-Host "Variables REMOVED: $($removed.Count)" -ForegroundColor Yellow

if ($removed.Count -gt 0) {
    Write-Host "`nRemoved variables:" -ForegroundColor Yellow
    $removed | Sort-Object -Unique | ForEach-Object { Write-Host "  - $_" }
}

Write-Host "`nCleaned file saved to: $envFile" -ForegroundColor Green
Write-Host "Backup saved to: $backupFile" -ForegroundColor Green
