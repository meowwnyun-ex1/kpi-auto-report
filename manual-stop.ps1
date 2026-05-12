# Manual Stop Script for DENSO Company KPI
# Usage: .\manual-stop.ps1

Write-Host "Manual Stop Script for DENSO Company KPI" -ForegroundColor Red
Write-Host ""

# Change to project directory
Set-Location $PSScriptRoot

# Stop PM2 processes
Write-Host "Stopping PM2 processes..." -ForegroundColor Blue
try {
    & pnpm pm2:stop
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Application stopped" -ForegroundColor Green
    } else {
        Write-Host "WARNING: No processes were running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Failed to stop application" -ForegroundColor Red
}

# Clean up PM2 processes (optional)
Write-Host "Cleaning up PM2 process list..." -ForegroundColor Blue
try {
    & pnpm pm2 delete all
    Write-Host "PM2 process list cleaned" -ForegroundColor Green
} catch {
    Write-Host "PM2 cleanup failed (not critical)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Application stopped successfully" -ForegroundColor Green
Write-Host "No auto-restart processes will run" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
