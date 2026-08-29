# Performance Testing Script (PowerShell)
# Runs all performance tests dan generate report

Write-Host "🚀 WargaNet Performance Testing Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if services are running
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check PostgreSQL
$postgresRunning = docker ps | Select-String "postgres"
if (-not $postgresRunning) {
    Write-Host "❌ PostgreSQL is not running" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ PostgreSQL is running" -ForegroundColor Green

# Check Redis
$redisRunning = docker ps | Select-String "redis"
if (-not $redisRunning) {
    Write-Host "❌ Redis is not running" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d redis" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Redis is running" -ForegroundColor Green

# Check if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Backend is running" -ForegroundColor Green
    $backendStarted = $false
} catch {
    Write-Host "⚠ Backend is not running" -ForegroundColor Yellow
    Write-Host "   Starting backend..." -ForegroundColor Yellow
    Start-Process -FilePath "pnpm" -ArgumentList "dev" -NoNewWindow
    Start-Sleep -Seconds 5
    $backendStarted = $true
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "1️⃣  Database Query Performance Tests" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

pnpm test performance-tests/database-query.spec.ts --run

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database query tests passed" -ForegroundColor Green
} else {
    Write-Host "✗ Database query tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "2️⃣  API Response Time Tests" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

pnpm test performance-tests/api-response-time.spec.ts --run

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ API response time tests passed" -ForegroundColor Green
} else {
    Write-Host "✗ API response time tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "3️⃣  Load Test Data Generation" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Generating load test data..." -ForegroundColor Yellow
pnpm tsx performance-tests/load-test.ts generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Load test data generated" -ForegroundColor Green
} else {
    Write-Host "✗ Load test data generation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Running tests with load data..." -ForegroundColor Yellow
pnpm test performance-tests/database-query.spec.ts --run

Write-Host ""
Write-Host "Cleaning up load test data..." -ForegroundColor Yellow
pnpm tsx performance-tests/load-test.ts cleanup

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Load test data cleaned up" -ForegroundColor Green
} else {
    Write-Host "⚠ Load test data cleanup failed (manual cleanup may be needed)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "📊 Performance Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ All performance tests completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review test results above"
Write-Host "2. Run Lighthouse audit for frontend (see PERFORMANCE-TESTING.md)"
Write-Host "3. Check for any performance warnings"
Write-Host "4. Optimize if needed"
Write-Host ""

# Kill backend if we started it
if ($backendStarted) {
    Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
}

exit 0
