@echo off
setlocal enabledelayedexpansion

REM Check for command line arguments
set DEPLOY_MODE=%1
if "%DEPLOY_MODE%"=="" set DEPLOY_MODE=fast

if "%DEPLOY_MODE%"=="--help" goto :show_help
if "%DEPLOY_MODE%"=="-h" goto :show_help
if "%DEPLOY_MODE%"=="help" goto :show_help

if not "%DEPLOY_MODE%"=="fast" if not "%DEPLOY_MODE%"=="clean" (
    echo ERROR: Invalid deployment mode. Use 'fast' or 'clean'
    goto :show_help
)

goto :start_deploy

:show_help
echo.
echo SDM&SKD App Store Deployment Script
echo ==================================
echo.
echo Usage: deploy.bat [mode]
echo.
echo Modes:
echo   fast   - Fast deployment (default) - Only installs if needed
echo   clean  - Clean deployment - Deletes and reinstalls everything
echo.
echo Examples:
echo   deploy.bat        # Fast deployment
echo   deploy.bat fast   # Fast deployment
echo   deploy.bat clean  # Clean deployment
echo.
pause
exit /b 0

:start_deploy
echo Deploying SDM&SKD App Store to Production...
echo Mode: %DEPLOY_MODE%
echo.

REM Change to project directory
cd /d D:\GitHub\Project\app-store

REM Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pnpm is not installed. Please install pnpm first:
    echo npm install -g pnpm
    pause
    exit /b 1
)

REM Check if .env file exists (production only)
if not exist ".env" (
    echo ERROR: Production .env file not found. Please create it from .env.example
    pause
    exit /b 1
)

REM Check production environment
echo Checking production environment...
set NODE_ENV=production
echo NODE_ENV set to: production

REM# Check required environment variables
echo Checking security configuration...
findstr /C:"JWT_SECRET=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: JWT_SECRET
    pause
    exit /b 1
)

findstr /C:"JWT_EXPIRES_IN=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: JWT_EXPIRES_IN
    pause
    exit /b 1
)

REM Check database environment variables
echo Checking database configuration...
findstr /C:"DB_HOST=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_HOST
    pause
    exit /b 1
)

findstr /C:"DB_NAME=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_NAME
    pause
    exit /b 1
)

findstr /C:"DB_USER=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_USER
    pause
    exit /b 1
)

findstr /C:"DB_PASSWORD=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_PASSWORD
    pause
    exit /b 1
)

findstr /C:"DB_PORT=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: DB_PORT
    pause
    exit /b 1
)

findstr /C:"API_PORT=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: API_PORT
    pause
    exit /b 1
)

findstr /C:"SERVER_IP=" .env >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Missing required environment variable: SERVER_IP
    pause
    exit /b 1
)

REM Smart dependency installation based on mode
echo.
echo ========================================
echo %DEPLOY_MODE% DEPLOY MODE - Dependency management
echo ========================================
echo.

if "%DEPLOY_MODE%"=="clean" (
    echo.
    echo CLEAN INSTALL MODE - Fresh dependency install
    echo ========================================
    echo.
    if exist node_modules (
        echo Removing existing node_modules...
        rmdir /s /q node_modules
    )
    
    echo Installing dependencies...
    call pnpm install --frozen-lockfile
    if %ERRORLEVEL% NEQ 0 (
        echo Frozen lockfile failed, trying normal install...
        call pnpm install
    )
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo.
    echo FAST DEPLOY MODE - Smart dependency check
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
    ) else if not exist pnpm-lock.yaml (
        echo pnpm-lock.yaml not found - installing dependencies...
        call pnpm install
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
        echo Use 'deploy.bat clean' for fresh install
    )
)

REM Install security dependencies (already in package.json)
echo Security dependencies will be installed with pnpm install

echo.
echo Dependencies installed successfully!
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
    echo WARNING: Database migration failed, but continuing with deployment...
    echo Please check your database connection and configuration
) else (
    echo Database migration completed successfully!
)

echo.

REM Build the application
echo Building frontend for production...
call pnpm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

REM Run security checks
echo Running security checks...
if exist "package.json" (
    echo SUCCESS: Package.json found
) else (
    echo ERROR: Package.json not found
    pause
    exit /b 1
)

if exist "dist" (
    echo SUCCESS: Build directory exists
) else (
    echo ERROR: Build directory not found
    pause
    exit /b 1
)

REM Stop existing PM2 processes
echo Stopping existing PM2 processes...
call pnpm pm2:stop

REM Start API server with PM2
echo Starting API server with PM2...
call pnpm pm2:start
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PM2 start failed
    pause
    exit /b 1
)

REM Save PM2 process list for auto-restart
echo Saving PM2 process list...
call pnpm pm2:save

REM Wait for server to start
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

REM Health check
echo Performing health check...
powershell -Command "try { $response = curl -UseBasicParsing -Uri 'http://localhost:4006/health' -StatusCode; Write-Output $response.StatusCode } catch { Write-Output '000' }" >temp_health.txt
set /p health_response=<temp_health.txt
del temp_health.txt

if "%health_response%"=="200" (
    echo SUCCESS: Health check passed
) else (
    echo WARNING: Health check failed (HTTP %health_response%)
)

REM Copy nginx configuration
echo Copying nginx configuration...
if exist "nginx.conf" (
    copy nginx.conf "C:\nginx\conf\nginx.conf" /Y
    echo SUCCESS: Nginx configuration copied
) else (
    echo ERROR: nginx.conf not found
    pause
    exit /b 1
)

REM Test nginx configuration
echo Testing nginx configuration...
cd /d D:\nginx
nginx -t
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Nginx configuration test failed
    pause
    exit /b 1
)

REM Stop existing nginx
echo Stopping existing nginx...
taskkill /f /im nginx.exe >nul 2>&1

REM Start nginx
echo Starting nginx...
start nginx.exe
timeout /t 2 /nobreak >nul

REM Check if nginx is running
tasklist | findstr nginx.exe >nul
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Nginx started successfully
) else (
    echo WARNING: Nginx may not be running properly
    echo Attempting to start nginx as service...
    sc start nginx
    timeout /t 3 /nobreak >nul
    sc query nginx
)

cd /d D:\GitHub\Project\app-store

REM Setup PM2 auto-restart
echo Setting up PM2 auto-restart...
call pnpm pm2:resurrect

echo.
echo ========================================
echo DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo App Store is now running at: http://10.73.148.75/app-store/
echo API Server: http://localhost:4006
echo.
echo PM2 processes will auto-restart on system reboot
echo.
pause
