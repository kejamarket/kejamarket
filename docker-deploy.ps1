# KejaMarket Docker Deployment Script
# Tests locally before deploying to production

Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       KejaMarket Docker Deployment                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "🔍 Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "Please install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose is available
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Building Docker image..." -ForegroundColor Yellow
docker-compose build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Starting container..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start container!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container started!" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Waiting 10 seconds for app to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🔍 Checking container status..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "📋 Container logs (last 30 lines):" -ForegroundColor Yellow
docker-compose logs --tail=30 app

Write-Host ""
Write-Host "🧪 Testing health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 10
    
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  Health Check Results                                     ║" -ForegroundColor Green
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host "Status: $($health.status)" -ForegroundColor $(if($health.status -eq 'online'){'Green'}else{'Red'})
    Write-Host "Database: $($health.database)" -ForegroundColor $(if($health.database -eq 'postgresql'){'Green'}else{'Red'})
    Write-Host "Version: $($health.version)" -ForegroundColor Green
    Write-Host "Commit: $($health.commit)" -ForegroundColor Green
    Write-Host "DB Host: $($health.dbHost)" -ForegroundColor Green
    
    if ($health.dataCounts) {
        Write-Host ""
        Write-Host "Data Counts:" -ForegroundColor Cyan
        Write-Host "  Properties: $($health.dataCounts.properties)" -ForegroundColor White
        Write-Host "  Services: $($health.dataCounts.services)" -ForegroundColor White
        Write-Host "  Marketplace: $($health.dataCounts.marketplace)" -ForegroundColor White
        Write-Host "  Users: $($health.dataCounts.users)" -ForegroundColor White
    }
    
    Write-Host ""
    if ($health.database -eq 'postgresql' -and $health.dataCounts.properties -eq 21) {
        Write-Host "✅ SUCCESS! Docker deployment is working perfectly!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your app is running at:" -ForegroundColor Cyan
        Write-Host "  Local: http://localhost:3001" -ForegroundColor White
        Write-Host "  API: http://localhost:3001/api/properties" -ForegroundColor White
        Write-Host "  Health: http://localhost:3001/api/health" -ForegroundColor White
    } else {
        Write-Host "⚠️  App is running but database issue detected" -ForegroundColor Yellow
        Write-Host "Database: $($health.database) (expected: postgresql)" -ForegroundColor Yellow
        Write-Host "Properties: $($health.dataCounts.properties) (expected: 21)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs with: docker-compose logs -f app" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose logs -f app" -ForegroundColor White
Write-Host "  Stop app: docker-compose down" -ForegroundColor White
Write-Host "  Restart: docker-compose restart app" -ForegroundColor White
Write-Host "  Rebuild: docker-compose up -d --build" -ForegroundColor White
Write-Host ""
