@echo off
chcp 65001 >nul
title Shomy Bay - Bot Only
color 0B

echo.
echo ========================================
echo    SHOMY BAY - BOT ONLY
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

echo [INFO] Checking bot file...
if not exist "bot.js" (
    echo [ERROR] bot.js not found!
    pause
    exit /b 1
)

echo [INFO] Checking config file...
if not exist "config.js" (
    echo [ERROR] config.js not found!
    pause
    exit /b 1
)

echo [INFO] Checking data folder...
if not exist "data" (
    echo [INFO] Creating data folder...
    mkdir data
)

echo [INFO] Starting bot...
echo [INFO] Bot started! Press Ctrl+C to stop
echo [WARNING] Moderation panel is NOT running!
echo.

node bot.js

echo.
echo [INFO] Bot stopped.
pause