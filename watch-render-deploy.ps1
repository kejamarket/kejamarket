# Watch Render Deployment Script
# Checks every 30 seconds until deployment succeeds

Write-Host "🔍 Watching Render deployment..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

$attempt = 1
$deployed = $false

while (-not $deployed) {
    Write-Host "[$attempt] Testing at $(Get-Date -Format 'HH:mm:ss')..." -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "https://kejamarket.co.ke/api/health" -UseBasicParsing -TimeoutSec 10
        
        Write-Host "  Status: $($response.status)" -ForegroundColor White
        Write-Host "  Database: $($response.database)" -ForegroundColor $(if ($response.database -eq 'postgresql') { 'Green' } else { 'Yellow' })
        Write-Host "  DB Host: $($response.dbHost)" -ForegroundColor White
        
        if ($response.dataCounts) {
            Write-Host "  Properties: $($response.dataCounts.properties)" -ForegroundColor Cyan
            Write-Host "  Services: $($response.dataCounts.services)" -ForegroundColor Cyan
            Write-Host "  Marketplace: $($response.dataCounts.marketplace)" -ForegroundColor Cyan
        }
        
        if ($response.database -eq 'postgresql' -and $response.dataCounts.properties -gt 0) {
            Write-Host "`n✅ SUCCESS! Render deployed successfully!" -ForegroundColor Green
            Write-Host "   Properties: $($response.dataCounts.properties)" -ForegroundColor Green
            Write-Host "   Services: $($response.dataCounts.services)" -ForegroundColor Green
            Write-Host "   Marketplace: $($response.dataCounts.marketplace)" -ForegroundColor Green
            Write-Host "`n🎉 Your site is now live with real data!" -ForegroundColor Magenta
            $deployed = $true
        } else {
            Write-Host "  ⏳ Still using old deployment (json-file mode)`n" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)`n" -ForegroundColor Red
    }
    
    if (-not $deployed) {
        $attempt++
        Start-Sleep -Seconds 30
    }
}

Write-Host "`nTest your live site:" -ForegroundColor Cyan
Write-Host "  Properties: https://kejamarket.co.ke/api/properties" -ForegroundColor White
Write-Host "  Services: https://kejamarket.co.ke/api/services" -ForegroundColor White
Write-Host "  Marketplace: https://kejamarket.co.ke/api/marketplace" -ForegroundColor White
