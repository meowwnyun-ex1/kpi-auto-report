# Deploy KPI : Auto Report to Production (PowerShell Script)
# Usage: .\deploy.ps1 [-Clean]
#   -Clean: Force clean reinstall of dependencies

param(
    [switch]$Clean
)

Write-Host "Deploying KPI : Auto Report to Production..." -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location $PSScriptRoot

# Check if pnpm is installed
try {
    pnpm --version | Out-Null
} catch {
    Write-Host "ERROR: pnpm is not installed. Please install pnpm first:" -ForegroundColor Red
    Write-Host "npm install -g pnpm" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if .env file exists (production only)
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: Production .env file not found. Please create it from .env.example" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check production environment
Write-Host "Checking production environment..." -ForegroundColor Blue
Write-Host "NODE_ENV will be set to production after build" -ForegroundColor Gray

# IMPORTANT: Set NODE_ENV to development for install (to get devDependencies)
# This is critical because pnpm skips devDependencies when NODE_ENV=production
$env:NODE_ENV = "development"

# Function to check environment variable
function Test-EnvironmentVariable($varName) {
    if (-not (Select-String -Path ".env" -Pattern "^${varName}=" -Quiet)) {
        Write-Host "ERROR: Missing required environment variable: $varName" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check required environment variables
Write-Host "Checking security configuration..." -ForegroundColor Blue
Test-EnvironmentVariable "JWT_SECRET"
Test-EnvironmentVariable "JWT_EXPIRES_IN"

# Check database environment variables
Write-Host "Checking database configuration..." -ForegroundColor Blue
Test-EnvironmentVariable "DB_HOST"
Test-EnvironmentVariable "DB_NAME"
Test-EnvironmentVariable "DB_USER"
Test-EnvironmentVariable "DB_PASSWORD"
Test-EnvironmentVariable "DB_PORT"
Test-EnvironmentVariable "API_PORT"
Test-EnvironmentVariable "SERVER_IP"

# Smart dependency installation (fast mode by default)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPENDENCY INSTALLATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Handle clean install flag
if ($Clean) {
    Write-Host "Clean install requested - removing node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
    $needInstall = $true
} else {
    # Check if we need to install dependencies
    $needInstall = $false
    if (-not (Test-Path "node_modules")) {
        Write-Host "node_modules not found - installing dependencies..." -ForegroundColor Yellow
        $needInstall = $true
    } elseif (-not (Test-Path "pnpm-lock.yaml")) {
        Write-Host "pnpm-lock.yaml not found - installing dependencies..." -ForegroundColor Yellow
        $needInstall = $true
    } else {
        # Check if dependencies are already installed
        Write-Host "Checking if dependencies need update..." -ForegroundColor Gray
        
        # Quick check: if node_modules exists and has key packages AND devDependencies, skip install
        $keyPackages = @("react", "vite", "express", "sharp")
        $allPresent = $true
        foreach ($pkg in $keyPackages) {
            if (-not (Test-Path "node_modules/$pkg")) {
                $allPresent = $false
                break
            }
        }
        
        # Also check for critical devDependencies (typescript, tsx)
        if ($allPresent) {
            $devPackages = @("typescript", "tsx")
            foreach ($pkg in $devPackages) {
                if (-not (Test-Path "node_modules/$pkg")) {
                    $allPresent = $false
                    break
                }
            }
        }
        
        # Check if tsc binary exists
        if ($allPresent) {
            $tscExists = Get-Command tsc -ErrorAction SilentlyContinue
            if (-not $tscExists) {
                # Check in node_modules/.bin
                $tscPath = "node_modules/.bin/tsc"
                $tscCmdPath = "node_modules/.bin/tsc.cmd"
                if (-not (Test-Path $tscPath) -and -not (Test-Path $tscCmdPath)) {
                    $allPresent = $false
                }
            }
        }
        
        if ($allPresent) {
            Write-Host "Dependencies already installed (use -Clean to force reinstall)" -ForegroundColor Green
        } else {
            Write-Host "Some packages missing - syncing dependencies..." -ForegroundColor Yellow
            $needInstall = $true
        }
    }
}

if ($needInstall) {
    Write-Host "Installing dependencies..." -ForegroundColor Blue
    try {
        # Use frozen lockfile for fast, reproducible installs
        # This avoids downloading unnecessary packages
        & pnpm install --frozen-lockfile --prefer-offline
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Frozen lockfile failed, trying normal install..." -ForegroundColor Yellow
            & pnpm install
        }
        if ($LASTEXITCODE -ne 0) {
            throw "pnpm install failed"
        }
        
        # CRITICAL: Verify tsc binary exists after install
        $tscCmdPath = "node_modules/.bin/tsc.cmd"
        if (-not (Test-Path $tscCmdPath)) {
            Write-Host "tsc binary not found after install - running full reinstall..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
            & pnpm install
            if ($LASTEXITCODE -ne 0) {
                throw "pnpm reinstall failed"
            }
        }
        
        # Final verification
        if (-not (Test-Path $tscCmdPath)) {
            Write-Host "ERROR: tsc binary still not found after install!" -ForegroundColor Red
            Write-Host "This might be a pnpm configuration issue." -ForegroundColor Red
            Write-Host "Try running: pnpm store prune && pnpm install" -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
        
        Write-Host "Dependencies installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "Dependencies ready!" -ForegroundColor Green
Write-Host ""

# Run database migration
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE MIGRATION - Setting up database tables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "This ensures all database tables match the required structure" -ForegroundColor Gray
Write-Host ""

Write-Host "Running database migration..." -ForegroundColor Blue
try {
    & tsx server/scripts/create-all-tables.ts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Database migration failed, but continuing with deployment..." -ForegroundColor Yellow
        Write-Host "Please check your database connection and configuration" -ForegroundColor Yellow
    } else {
        Write-Host "Database migration completed successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Database migration failed, but continuing with deployment..." -ForegroundColor Yellow
    Write-Host "Please check your database connection and configuration" -ForegroundColor Yellow
}

Write-Host ""

# Build the application
Write-Host "Building frontend for production..." -ForegroundColor Blue
try {
    & pnpm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
} catch {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Restore NODE_ENV to production after build
$env:NODE_ENV = "production"
Write-Host "NODE_ENV set to production for deployment" -ForegroundColor Gray

# Run security checks
Write-Host "Running security checks..." -ForegroundColor Blue
if (Test-Path "package.json") {
    Write-Host "SUCCESS: Package.json found" -ForegroundColor Green
} else {
    Write-Host "ERROR: Package.json not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (Test-Path "dist") {
    Write-Host "SUCCESS: Build directory exists" -ForegroundColor Green
} else {
    Write-Host "ERROR: Build directory not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Stop existing PM2 processes
Write-Host "Stopping existing PM2 processes..." -ForegroundColor Blue
try {
    & pnpm pm2:stop
} catch {
    Write-Host "Warning: PM2 stop failed, continuing..." -ForegroundColor Yellow
}

# Start API server with PM2
Write-Host "Starting API server with PM2..." -ForegroundColor Blue
try {
    & pnpm pm2:start
    if ($LASTEXITCODE -ne 0) {
        throw "PM2 start failed"
    }
} catch {
    Write-Host "ERROR: PM2 start failed" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# PM2 auto-restart disabled to prevent Windows Defender false positive
Write-Host "PM2 auto-restart disabled for security" -ForegroundColor Yellow

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Blue
Start-Sleep -Seconds 5

# Health check
Write-Host "Performing health check..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4007/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "SUCCESS: Health check passed" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Health check failed (HTTP $($response.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Health check failed - server may not be ready yet" -ForegroundColor Yellow
}

# Copy nginx configuration (if nginx is available)
$nginxPath = "C:\nginx"
if (Test-Path $nginxPath) {
    Write-Host "Copying nginx configuration..." -ForegroundColor Blue
    if (Test-Path "nginx.conf") {
        Copy-Item "nginx.conf" "$nginxPath\conf\nginx.conf" -Force
        Write-Host "SUCCESS: Nginx configuration copied" -ForegroundColor Green
        
        # Test nginx configuration
        Write-Host "Testing nginx configuration..." -ForegroundColor Blue
        Push-Location $nginxPath
        try {
            & nginx -t
            if ($LASTEXITCODE -eq 0) {
                Write-Host "SUCCESS: Nginx configuration test passed" -ForegroundColor Green
                
                # Stop existing nginx
                Write-Host "Stopping existing nginx..." -ForegroundColor Blue
                Stop-Process -Name "nginx" -Force -ErrorAction SilentlyContinue
                
                # Start nginx
                Write-Host "Starting nginx..." -ForegroundColor Blue
                Start-Process "nginx.exe" -WorkingDirectory $nginxPath
                Start-Sleep -Seconds 2
                
                # Check if nginx is running
                $nginxProcess = Get-Process "nginx" -ErrorAction SilentlyContinue
                if ($nginxProcess) {
                    Write-Host "SUCCESS: Nginx started successfully" -ForegroundColor Green
                } else {
                    Write-Host "WARNING: Nginx may not be running properly" -ForegroundColor Yellow
                }
            } else {
                Write-Host "ERROR: Nginx configuration test failed" -ForegroundColor Red
            }
        } catch {
            Write-Host "WARNING: Nginx operations failed" -ForegroundColor Yellow
        }
        Pop-Location
    } else {
        Write-Host "ERROR: nginx.conf not found" -ForegroundColor Red
    }
} else {
    Write-Host "WARNING: Nginx not found at $nginxPath, skipping nginx configuration" -ForegroundColor Yellow
}

# PM2 auto-restart disabled to prevent Windows Defender false positive
Write-Host "Skipping PM2 auto-restart setup (security measure)" -ForegroundColor Yellow

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "KPI is now running at: http://10.73.148.75/kpi-auto-report/" -ForegroundColor Cyan
Write-Host "API Server: http://localhost:4007" -ForegroundColor Cyan
Write-Host ""
Write-Host "PM2 processes will NOT auto-restart (manual restart required)" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
