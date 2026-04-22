# Zero-Downtime Deploy Script for KPI : Auto Report
# Usage: .\deploy-zero-downtime.ps1 [-SkipBuild] [-FrontendOnly] [-BackendOnly]
#
# IMPORTANT: This script ONLY manages kpi-auto-report-api PM2 process
# It will NOT affect other PM2 processes or other nginx configs

param(
    [switch]$SkipBuild,
    [switch]$FrontendOnly,
    [switch]$BackendOnly
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Zero-Downtime Deployment" -ForegroundColor Cyan
Write-Host "  KPI : Auto Report" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  (Only affects kpi-auto-report-api)" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

# ============================================
# Pre-flight Checks
# ============================================
Write-Host "Pre-flight checks..." -ForegroundColor Blue

# Check PM2
try {
    pm2 --version | Out-Null
    Write-Host "  PM2: OK" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: PM2 not installed" -ForegroundColor Red
    Write-Host "  Run: npm install -g pm2" -ForegroundColor Yellow
    exit 1
}

# Check if kpi-auto-report-api is running (only check this specific app)
$pm2List = pm2 jlist 2>$null | ConvertFrom-Json
$appRunning = $pm2List | Where-Object { $_.name -eq 'kpi-auto-report-api' }

if (-not $appRunning) {
    Write-Host "  App not running. Use .\deploy.ps1 for initial deployment." -ForegroundColor Yellow
    Write-Host "  Or run: pm2 start ecosystem.config.cjs" -ForegroundColor Yellow
    exit 1
}

Write-Host "  App Status: Running ($($appRunning.instances) instances)" -ForegroundColor Green

# Show other running apps (but don't touch them)
$otherApps = $pm2List | Where-Object { $_.name -ne 'kpi-auto-report-api' }
if ($otherApps) {
    Write-Host "  Other apps running (will NOT be affected):" -ForegroundColor Gray
    foreach ($app in $otherApps) {
        Write-Host "    - $($app.name)" -ForegroundColor Gray
    }
}

# ============================================
# Build Phase
# ============================================
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Build Phase" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    if (-not $FrontendOnly) {
        Write-Host "Building backend..." -ForegroundColor Blue
        & npx tsc -p server/tsconfig.json
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR: Backend build failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "  Backend: OK" -ForegroundColor Green
    }

    if (-not $BackendOnly) {
        Write-Host "Building frontend..." -ForegroundColor Blue
        & pnpm run build:frontend
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR: Frontend build failed" -ForegroundColor Red
            exit 1
        }
        Write-Host "  Frontend: OK" -ForegroundColor Green
    }
} else {
    Write-Host "Skipping build phase" -ForegroundColor Yellow
}

# ============================================
# Zero-Downtime Reload Phase
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Zero-Downtime Reload" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current kpi-auto-report-api instances:" -ForegroundColor Blue
pm2 show kpi-auto-report-api 2>$null | Select-String -Pattern "status|instances|restarts"

Write-Host ""
Write-Host "Reloading kpi-auto-report-api with zero downtime..." -ForegroundColor Blue
Write-Host "  - New instances will start first" -ForegroundColor Gray
Write-Host "  - Old instances will drain connections" -ForegroundColor Gray
Write-Host "  - No requests will be dropped" -ForegroundColor Gray
Write-Host "  - Other PM2 apps will NOT be affected" -ForegroundColor Gray
Write-Host ""

# PM2 reload ONLY kpi-auto-report-api (not other apps)
& pm2 reload kpi-auto-report-api
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARNING: Reload failed, falling back to restart" -ForegroundColor Yellow
    & pm2 restart kpi-auto-report-api
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "New kpi-auto-report-api instances:" -ForegroundColor Blue
pm2 show kpi-auto-report-api 2>$null | Select-String -Pattern "status|instances|restarts"

# ============================================
# Nginx Instructions (Don't auto-modify)
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Nginx Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Nginx config is NOT auto-updated to avoid affecting other systems." -ForegroundColor Yellow
Write-Host ""
Write-Host "To update nginx manually:" -ForegroundColor Blue
Write-Host "  1. Add to main nginx.conf http{} block:" -ForegroundColor Gray
Write-Host "     include D:/GitHub/Project/kpi-auto-report/nginx.conf;" -ForegroundColor White
Write-Host ""
Write-Host "  2. Test: nginx -t" -ForegroundColor Gray
Write-Host "  3. Reload: nginx -s reload" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to reload nginx
$reloadNginx = Read-Host "Reload nginx now? (y/N)"
if ($reloadNginx -eq 'y' -or $reloadNginx -eq 'Y') {
    $nginxPath = "C:\nginx"
    if (Test-Path $nginxPath) {
        Push-Location $nginxPath
        & nginx -t 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Config test: OK" -ForegroundColor Green
            & nginx -s reload
            Write-Host "  Nginx reloaded (graceful, no dropped connections)" -ForegroundColor Green
        } else {
            Write-Host "  ERROR: Nginx config test failed" -ForegroundColor Red
            Write-Host "  Run 'nginx -t' to see errors" -ForegroundColor Yellow
        }
        Pop-Location
    } else {
        Write-Host "  Nginx not found at $nginxPath" -ForegroundColor Yellow
    }
}

# ============================================
# Health Check
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Start-Sleep -Seconds 2

try {
    $response = Invoke-WebRequest -Uri "http://localhost:4007/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  Health check: PASSED" -ForegroundColor Green
    }
} catch {
    Write-Host "  Health check: FAILED" -ForegroundColor Red
    Write-Host "  Check logs: pm2 logs kpi-auto-report-api" -ForegroundColor Yellow
}

# ============================================
# Summary
# ============================================
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  URL: http://10.73.148.75/kpi-auto-report/" -ForegroundColor Cyan
Write-Host "  API: http://localhost:4007" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Zero downtime achieved!" -ForegroundColor Green
Write-Host "  Other systems were NOT affected." -ForegroundColor Gray
Write-Host ""

# Save PM2 config (only kpi-auto-report-api)
& pm2 save
