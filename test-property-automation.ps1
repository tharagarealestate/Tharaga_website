# Test Property Automation Flow
# This script tests the complete property upload automation flow end-to-end

$propertyId = "39026116-b35a-496d-9085-be3b7d5346ed"
$baseUrl = "http://localhost:3000"
$internalApiKey = "1EF670C3dADc945aef8B2b"

Write-Host "=== PROPERTY AUTOMATION FLOW TEST ===" -ForegroundColor Cyan
Write-Host "Property ID: $propertyId" -ForegroundColor Yellow
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Step 1: Test get_property_marketing_context RPC
Write-Host "Step 1: Testing get_property_marketing_context RPC..." -ForegroundColor Green

# Step 2: Test auto-trigger endpoint
Write-Host "Step 2: Testing auto-trigger endpoint..." -ForegroundColor Green
$autoTriggerBody = @{
    property_id = $propertyId
} | ConvertTo-Json

try {
    $autoTriggerResponse = Invoke-RestMethod -Uri "$baseUrl/api/automation/marketing/auto-trigger" `
        -Method POST `
        -Body $autoTriggerBody `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer $internalApiKey" }
    
    Write-Host "✅ Auto-trigger successful!" -ForegroundColor Green
    Write-Host ($autoTriggerResponse | ConvertTo-Json -Depth 5) -ForegroundColor White
} catch {
    Write-Host "❌ Auto-trigger failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan











