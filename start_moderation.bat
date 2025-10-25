@echo off
chcp 65001 >nul
title Shomy Bay - Moderation Panel
color 0A

echo.
echo ========================================
echo    SHOMY BAY - MODERATION PANEL
echo ========================================
echo.

echo [INFO] Checking dependencies...
if not exist "node_modules" (
    echo [ERROR] node_modules folder not found!
    echo [INFO] Installing dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo [INFO] Checking moderation file...
if not exist "moderation_server.js" (
    echo [ERROR] moderation_server.js not found!
    pause
    exit /b 1
)

echo [INFO] Checking data folder...
if not exist "data" (
    echo [INFO] Creating data folder...
    mkdir data
)

echo [INFO] Starting moderation server...
echo [INFO] Web panel will be available at: http://localhost:3000
echo [INFO] Press Ctrl+C to stop
echo.

node moderation_server.js

echo.
echo [INFO] Moderation server stopped.
pause