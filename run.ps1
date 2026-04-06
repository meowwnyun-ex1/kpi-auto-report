# Start SDM&SKD App Store Development Server (PowerShell Script)
# Usage: .\run.ps1

Write-Host "Starting SDM&SKD App Store Development Server..." -ForegroundColor Green
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

# Check if .env or .env.development file exists
if (Test-Path ".env.development") {
    Write-Host "Using development environment: .env.development" -ForegroundColor Green
    $envFile = ".env.development"
} elseif (Test-Path ".env") {
    Write-Host "Using production environment: .env" -ForegroundColor Green
    $envFile = ".env"
} else {
    Write-Host "ERROR: Neither .env nor .env.development file found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to check environment variable
function Test-EnvironmentVariable($varName) {
    if (-not (Select-String -Path $envFile -Pattern "^${varName}=" -Quiet)) {
        Write-Host "ERROR: Missing required environment variable: $varName" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check required environment variables
Write-Host "Checking environment variables..." -ForegroundColor Blue
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

# Smart dependency installation
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPENDENCY INSTALLATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are already installed
$needInstall = $false
if (-not (Test-Path "node_modules")) {
    Write-Host "node_modules not found - installing dependencies..." -ForegroundColor Yellow
    $needInstall = $true
} else {
    # Quick check: if node_modules exists and has key packages AND devDependencies, skip install
    $keyPackages = @("react", "vite", "express")
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
        $tscPath = "node_modules/.bin/tsc.cmd"
        if (-not (Test-Path $tscPath)) {
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host "Dependencies already installed - skipping" -ForegroundColor Green
    } else {
        Write-Host "Some packages missing - syncing dependencies..." -ForegroundColor Yellow
        $needInstall = $true
    }
}

if ($needInstall) {
    Write-Host "Installing dependencies..." -ForegroundColor Blue
    try {
        & pnpm install --frozen-lockfile --prefer-offline
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Frozen lockfile failed, trying normal install..." -ForegroundColor Yellow
            & pnpm install
        }
        if ($LASTEXITCODE -ne 0) {
            throw "pnpm install failed"
        }
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
        Write-Host "WARNING: Database migration failed, but continuing with startup..." -ForegroundColor Yellow
        Write-Host "Please check your database connection and configuration" -ForegroundColor Yellow
    } else {
        Write-Host "Database migration completed successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Database migration failed, but continuing with startup..." -ForegroundColor Yellow
    Write-Host "Please check your database connection and configuration" -ForegroundColor Yellow
}

Write-Host ""

# Start the application
Write-Host ""
Write-Host "Starting SDM&SKD App Store..." -ForegroundColor Cyan
if ($envFile -eq ".env.development") {
    Write-Host "Environment: Development" -ForegroundColor Gray
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
    Write-Host "API: http://localhost:5173/api" -ForegroundColor White
    Write-Host "Health: http://localhost:5173/health" -ForegroundColor White
} else {
    Write-Host "Environment: Production" -ForegroundColor Gray
    Write-Host "Frontend: http://10.73.148.75:3006" -ForegroundColor White
    Write-Host "API: http://10.73.148.75:3006/api" -ForegroundColor White
    Write-Host "Health: http://10.73.148.75:3006/health" -ForegroundColor White
}
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

try {
    & pnpm run dev
} catch {
    Write-Host "Application stopped" -ForegroundColor Yellow
}

Read-Host "Press Enter to exit"
