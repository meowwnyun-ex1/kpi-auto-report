# Manual Start Script for KPI Auto Report
# This script replaces the auto-start functionality to prevent Windows Defender false positives
# Usage: .\manual-start.ps1

Write-Host "Manual Start Script for KPI Auto Report" -ForegroundColor Green
Write-Host "This script manually starts the application without auto-restart features" -ForegroundColor Yellow
Write-Host ""

# Change to project directory
Set-Location $PSScriptRoot

# Check if PM2 is running
Write-Host "Checking PM2 status..." -ForegroundColor Blue
try {
    $pm2List = & pnpm pm2:list 2>$null
    if ($pm2List -match "kpi-auto-report-api") {
        Write-Host "PM2 process found, stopping first..." -ForegroundColor Yellow
        & pnpm pm2:stop
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "PM2 not running or not installed" -ForegroundColor Yellow
}

# Start the application
Write-Host "Starting KPI Auto Report..." -ForegroundColor Cyan
try {
    & pnpm pm2:start
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Application started" -ForegroundColor Green
        Write-Host "API Server: http://localhost:4007" -ForegroundColor White
        Write-Host "Frontend: http://10.73.148.75/kpi-auto-report/" -ForegroundColor White
        Write-Host ""
        Write-Host "NOTE: Auto-restart is disabled for security" -ForegroundColor Yellow
        Write-Host "To restart manually, run this script again" -ForegroundColor Yellow
    } else {
        Write-Host "ERROR: Failed to start application" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Failed to start application" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
