@echo off
SETLOCAL EnableDelayedExpansion
TITLE Zentest Automation Server

echo ===================================================
echo   ZENTEST AUTOMATION COMPANION SERVER
echo ===================================================
echo.

:: 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed!
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b
)

:: 2. Check for node_modules
if not exist node_modules (
    echo [INFO] First time setup: Installing dependencies...
    echo This may take a minute depending on your internet speed.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b
    )
)

:: 3. Ensure Playwright Browser is installed
echo [INFO] Verifying testing browser (Chromium)...
call npx playwright install chromium
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Playwright browser.
    pause
    exit /b
)

:: 4. Start the Server
echo.
echo [SUCCESS] Everything is ready!
echo [INFO] Starting Zentest Server on http://localhost:3002
echo [TIP] Keep this window open while using the Zentest website.
echo.
node index.js

:: If the server crashes or stops
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Server stopped unexpectedly.
    pause
)
