@echo off
echo Starting KPI : Auto Report Development Server...
echo.

REM Change to project directory
cd /d "%~dp0"

REM Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pnpm is not installed. Please install pnpm first:
    echo npm install -g pnpm
    pause
    exit /b 1
)

REM Check if .env or .env.development file exists
if exist ".env.development" (
    echo Using development environment: .env.development
) else if exist ".env" (
    echo Using production environment: .env
) else (
    echo ERROR: Neither .env nor .env.development file found
    pause
    exit /b 1
)

REM Check required environment variables in both files
echo Checking environment variables...
if exist ".env.development" (
    set ENV_FILE=.env.development
) else (
    set ENV_FILE=.env
)

findstr /C:"JWT_SECRET=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: JWT_SECRET
    pause
    exit /b 1
)

findstr /C:"JWT_EXPIRES_IN=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: JWT_EXPIRES_IN
    pause
    exit /b 1
)

REM Check database environment variables
echo Checking database configuration...
findstr /C:"DB_HOST=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_HOST
    pause
    exit /b 1
)

findstr /C:"DB_NAME=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_NAME
    pause
    exit /b 1
)

findstr /C:"DB_USER=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_USER
    pause
    exit /b 1
)

findstr /C:"DB_PASSWORD=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_PASSWORD
    pause
    exit /b 1
)

findstr /C:"DB_PORT=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_PORT
    pause
    exit /b 1
)

findstr /C:"API_PORT=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: API_PORT
    pause
    exit /b 1
)

findstr /C:"SERVER_IP=" !ENV_FILE! >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: SERVER_IP
    pause
    exit /b 1
)

REM Smart dependency installation
echo.
echo ========================================
echo DEPENDENCY INSTALLATION
echo ========================================
echo.

if not exist node_modules (
    echo node_modules not found - installing dependencies...
    call pnpm install --frozen-lockfile --prefer-offline
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else if not exist node_modules\.bin\tsc.cmd (
    echo tsc binary not found - reinstalling dependencies...
    call pnpm install --frozen-lockfile --prefer-offline
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else if not exist node_modules\typescript (
    echo typescript not found - reinstalling dependencies...
    call pnpm install --frozen-lockfile --prefer-offline
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed - skipping
)

echo.
echo Dependencies ready!
echo.

REM Run database migration
echo.
echo ========================================
echo DATABASE MIGRATION - Setting up database tables
echo ========================================
echo This ensures all database tables match the required structure
echo.

echo Running database migration...
tsx server/scripts/create-all-tables.ts
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Database migration failed, but continuing with startup...
    echo Please check your database connection and configuration
) else (
    echo Database migration completed successfully!
)

echo.

REM Start the application
echo.
echo Starting KPI : Auto Report...
if exist ".env.development" (
    echo Environment: Development
    echo Frontend: http://localhost:3007
    echo API: http://localhost:4007/api
    echo Health: http://localhost:4007/health
) else (
    echo Environment: Production
    echo Frontend: http://10.73.148.75/app-store
    echo API: http://10.73.148.75/app-store/api
    echo Health: http://10.73.148.75/app-store/health
)
echo Press Ctrl+C to stop the server
echo.

pnpm run dev

pause
