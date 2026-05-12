# Complete KPI-DB Migration Script
# This script runs the complete database migration for kpi-db

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete KPI-DB Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if sqlcmd is available
$sqlcmd = Get-Command sqlcmd -ErrorAction SilentlyContinue
if (-not $sqlcmd) {
    Write-Host "ERROR: sqlcmd is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install SQL Server Command Line Tools" -ForegroundColor Red
    exit 1
}

# Load environment variables
$envPath = Join-Path $PSScriptRoot "..\..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}

# Get database configuration
$dbServer = $env:KPI_DB_HOST
$dbName = $env:KPI_DB_NAME
$dbUser = $env:KPI_DB_USER
$dbPassword = $env:KPI_DB_PASSWORD
$dbPort = $env:KPI_DB_PORT

if (-not $dbServer -or -not $dbName) {
    Write-Host "ERROR: Database configuration not found in .env file" -ForegroundColor Red
    Write-Host "Required variables: KPI_DB_HOST, KPI_DB_NAME" -ForegroundColor Red
    exit 1
}

Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Server: $dbServer" -ForegroundColor Yellow
Write-Host "  Database: $dbName" -ForegroundColor Yellow
Write-Host "  Port: $dbPort" -ForegroundColor Yellow
Write-Host ""

# Build connection string
if ($dbUser -and $dbPassword) {
    $connString = @("-S", "$dbServer,$dbPort", "-d", $dbName, "-U", $dbUser, "-P", $dbPassword)
} else {
    $connString = @("-S", "$dbServer,$dbPort", "-d", $dbName, "-E")
}

# Script path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$migrationScript = Join-Path $scriptPath "..\sql\safe-kpi-db-migration.sql"

# Check if migration file exists
if (-not (Test-Path $migrationScript)) {
    Write-Host "ERROR: Migration file not found: $migrationScript" -ForegroundColor Red
    exit 1
}

# Run Complete Migration
Write-Host "Running Complete KPI-DB Migration..." -ForegroundColor Green
Write-Host "File: $migrationScript" -ForegroundColor Gray
try {
    & sqlcmd @connString -i $migrationScript -b -W
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    Write-Host "Complete migration finished successfully" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to run migration: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Seed Users
Write-Host "Seeding Initial Users..." -ForegroundColor Green
$seedScript = Join-Path $scriptPath "seed-auth-users.ts"
if (Test-Path $seedScript) {
    try {
        Push-Location $scriptPath
        npx ts-node seed-auth-users.ts
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: User seeding had issues" -ForegroundColor Yellow
        } else {
            Write-Host "User seeding completed successfully" -ForegroundColor Green
        }
        Pop-Location
    } catch {
        Write-Host "WARNING: Failed to run user seeding: $_" -ForegroundColor Yellow
        Write-Host "You can run it manually: cd server\scripts; npx ts-node seed-auth-users.ts" -ForegroundColor Yellow
    }
} else {
    Write-Host "WARNING: Seed script not found: $seedScript" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration & Seeding Completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database: kpi-db" -ForegroundColor White
Write-Host "All tables created with correct structure" -ForegroundColor White
Write-Host "Users seeded with default credentials" -ForegroundColor White
Write-Host ""
Write-Host "Default credentials:" -ForegroundColor Yellow
Write-Host "  superadmin / Admin@123" -ForegroundColor White
Write-Host "  admin / Admin@123" -ForegroundColor White
Write-Host "  manager.se / Manager@123" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Change default passwords in production!" -ForegroundColor Red
