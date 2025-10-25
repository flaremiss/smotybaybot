@echo off
chcp 65001 >nul
title Shomy Bay - Restart Moderation
color 0E

echo.
echo ========================================
echo  SHOMY BAY - RESTART MODERATION
echo ========================================
echo.

echo [INFO] Stopping moderation server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *moderation*" 2>nul
taskkill /F /IM node.exe /FI "COMMANDLINE eq *moderation_server.js*" 2>nul

echo [INFO] Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo [INFO] Starting moderation server...
echo [INFO] Web panel will be available at: http://localhost:3000
echo.

start "Moderation Server" cmd /k "node moderation_server.js"

echo [SUCCESS] Moderation server restarted!
echo [INFO] Moderation panel: http://localhost:3000
echo.
pause