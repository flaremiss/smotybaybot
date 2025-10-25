@echo off
chcp 65001 >nul
title Shomy Bay - Stop All Services
color 0C

echo.
echo ========================================
echo    SHOMY BAY - STOP ALL SERVICES
echo ========================================
echo.

echo [INFO] Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul

if errorlevel 1 (
    echo [INFO] No Node.js processes found or already stopped.
) else (
    echo [INFO] All Node.js processes stopped.
)

echo [INFO] Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo [INFO] Cleaning temporary files...
if exist "debug.log" del "debug.log" 2>nul
if exist "*.tmp" del "*.tmp" 2>nul

echo.
echo [SUCCESS] All services stopped!
echo.
pause