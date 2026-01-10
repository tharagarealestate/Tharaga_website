# PowerShell script to estimate environment variable size
# This helps identify if you're approaching the 4KB limit

Write-Host "=== Netlify Environment Variable Size Estimator ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script estimates the total size of environment variables." -ForegroundColor Yellow
Write-Host "AWS Lambda limit: 4KB (4096 bytes) per function" -ForegroundColor Yellow
Write-Host ""

# Common environment variables that Netlify might pass to functions
# Add your actual variable names and estimated sizes here
$envVars = @{
    # Supabase (usually largest - JWT tokens are ~500-800 bytes each)
    "SUPABASE_URL" = 100
    "NEXT_PUBLIC_SUPABASE_URL" = 100
    "SUPABASE_ANON_KEY" = 600  # JWT token
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" = 600  # JWT token
    "SUPABASE_SERVICE_ROLE_KEY" = 600  # JWT token
    "SUPABASE_SERVICE_ROLE" = 600  # JWT token (DUPLICATE - remove this)
    
    # Payment providers
    "RAZORPAY_KEY_ID" = 50
    "RAZORPAY_KEY_SECRET" = 50
    "RAZORPAY_WEBHOOK_SECRET" = 50
    "STRIPE_SECRET_KEY" = 100
    "STRIPE_WEBHOOK_SECRET" = 100
    
    # API Keys (typically 30-100 bytes)
    "RESEND_API_KEY" = 50
    "OPENAI_API_KEY" = 60
    "TWILIO_ACCOUNT_SID" = 50
    "TWILIO_AUTH_TOKEN" = 50
    
    # URLs and configuration
    "NEXT_PUBLIC_APP_URL" = 50
    "NEXT_PUBLIC_API_URL" = 50
    "BACKEND_URL" = 50
    
    # Other common variables
    "ADMIN_TOKEN" = 50
    "CRON_SECRET" = 50
    "NODE_ENV" = 10
}

$totalSize = 0
$varCount = $envVars.Count

Write-Host "Estimated sizes (key + value + overhead):" -ForegroundColor Cyan
Write-Host ""

foreach ($key in $envVars.Keys | Sort-Object) {
    $size = $envVars[$key]
    # Add overhead: key name length + "=" + value + null terminator + env var overhead (~10 bytes)
    $keySize = $key.Length + 1 + $size + 10
    $totalSize += $keySize
    Write-Host "  $key : ~$keySize bytes" -ForegroundColor $(if ($size -gt 500) { "Yellow" } else { "Gray" })
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Total environment variables: $varCount" -ForegroundColor White
Write-Host "Estimated total size: ~$totalSize bytes ($([math]::Round($totalSize/1024, 2)) KB)" -ForegroundColor White
Write-Host ""

if ($totalSize -gt 4096) {
    Write-Host "❌ EXCEEDS 4KB LIMIT!" -ForegroundColor Red
    Write-Host "   You need to reduce environment variables by $($totalSize - 4096) bytes" -ForegroundColor Red
} elseif ($totalSize -gt 3500) {
    Write-Host "⚠️  WARNING: Close to 4KB limit!" -ForegroundColor Yellow
    Write-Host "   Consider removing unused variables" -ForegroundColor Yellow
} else {
    Write-Host "✓ Within 4KB limit ($(4096 - $totalSize) bytes remaining)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Note: This is an estimate. Actual size may vary." -ForegroundColor Gray
Write-Host "Netlify passes ALL site environment variables to ALL functions." -ForegroundColor Gray
Write-Host ""

# Check for common duplicates
Write-Host "=== Duplicate Check ===" -ForegroundColor Cyan
$duplicates = @(
    @("SUPABASE_SERVICE_ROLE", "SUPABASE_SERVICE_ROLE_KEY", "Remove SUPABASE_SERVICE_ROLE, keep only SUPABASE_SERVICE_ROLE_KEY")
)

$foundDuplicates = $false
foreach ($dup in $duplicates) {
    $key1 = $dup[0]
    $key2 = $dup[1]
    $message = $dup[2]
    
    if ($envVars.ContainsKey($key1) -and $envVars.ContainsKey($key2)) {
        Write-Host "⚠️  DUPLICATE: $key1 and $key2 both exist" -ForegroundColor Yellow
        Write-Host "   Recommendation: $message" -ForegroundColor Yellow
        $foundDuplicates = $true
    }
}

if (-not $foundDuplicates) {
    Write-Host "✓ No obvious duplicates found" -ForegroundColor Green
}

Write-Host ""
Write-Host "To fix: Go to Netlify Dashboard → Site Settings → Environment Variables" -ForegroundColor Cyan
Write-Host "Remove duplicate/unused variables to stay under 4KB limit." -ForegroundColor Cyan

























