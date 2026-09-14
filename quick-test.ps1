# Quick Render Deployment Test
Write-Host "`n🔍 Testing Render Deployment Status...`n" -ForegroundColor Cyan

try {
    $health = Invoke-RestMethod -Uri "https://kejamarket.co.ke/api/health" -UseBasicParsing -TimeoutSec 10
    
    Write-Host "Status: " -NoNewline
    Write-Host $health.status -ForegroundColor $(if ($health.status -eq 'online') { 'Green' } else { 'Red' })
    
    Write-Host "Database Mode: " -NoNewline
    Write-Host $health.database -ForegroundColor $(if ($health.database -eq 'postgresql') { 'Green' } else { 'Yellow' })
    
    Write-Host "Version: " -NoNewline
    if ($health.version) {
        Write-Host $health.version -ForegroundColor Green
    } else {
        Write-Host "OLD CODE (no version field)" -ForegroundColor Red
    }
    
    Write-Host "Commit: " -NoNewline
    if ($health.commit) {
        Write-Host $health.commit -ForegroundColor Green
    } else {
        Write-Host "OLD CODE (no commit field)" -ForegroundColor Red
    }
    
    Write-Host "`nData Counts:"
    if ($health.dataCounts) {
        Write-Host "  Properties: $($health.dataCounts.properties)" -ForegroundColor $(if ($health.dataCounts.properties -gt 0) { 'Green' } else { 'Red' })
        Write-Host "  Services: $($health.dataCounts.services)" -ForegroundColor $(if ($health.dataCounts.services -gt 0) { 'Green' } else { 'Red' })
        Write-Host "  Marketplace: $($health.dataCounts.marketplace)" -ForegroundColor $(if ($health.dataCounts.marketplace -gt 0) { 'Green' } else { 'Red' })
        Write-Host "  Users: $($health.dataCounts.users)" -ForegroundColor $(if ($health.dataCounts.users -gt 0) { 'Green' } else { 'Red' })
    } else {
        Write-Host "  No data counts (OLD CODE)" -ForegroundColor Red
    }
    
    Write-Host "`n" -NoNewline
    
    if ($health.database -eq 'postgresql' -and $health.dataCounts.properties -eq 21) {
        Write-Host "✅ SUCCESS! Render is deployed and working!" -ForegroundColor Green
        Write-Host "`nYour site is live with:" -ForegroundColor Cyan
        Write-Host "  • 21 rental properties" -ForegroundColor White
        Write-Host "  • 10 service providers" -ForegroundColor White
        Write-Host "  • 20 marketplace items" -ForegroundColor White
        Write-Host "`nVisit: https://kejamarket.co.ke" -ForegroundColor Magenta
    } elseif ($health.version -and $health.commit) {
        Write-Host "⚠️  New code is deployed but DATABASE issue:" -ForegroundColor Yellow
        Write-Host "   - Code version: $($health.version)" -ForegroundColor White
        Write-Host "   - But database mode: $($health.database)" -ForegroundColor White
        Write-Host "`n   SOLUTION: Check Render environment variables" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Render is still running OLD code" -ForegroundColor Red
        Write-Host "`n   Expected commit: c350dfb" -ForegroundColor White
        Write-Host "   Current commit: $(if ($health.commit) { $health.commit } else { 'unknown (very old)' })" -ForegroundColor White
        Write-Host "`n   SOLUTION: Go to Render dashboard and click 'Manual Deploy'" -ForegroundColor Yellow
        Write-Host "   Link: https://dashboard.render.com" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "Error connecting to site: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
