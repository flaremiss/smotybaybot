@echo off
chcp 65001 >nul
title Shomy Bay - Quick Start Guide
color 0F

echo.
echo ========================================
echo    SHOMY BAY - QUICK START GUIDE
echo ========================================
echo.
echo Available options:
echo.
echo 1. Start Moderation Panel Only
echo 2. Start Bot Only  
echo 3. Start Both (Bot + Moderation)
echo 4. Stop All Services
echo 5. Restart Moderation
echo 6. Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo.
    echo Starting Moderation Panel...
    start "" "start_moderation.bat"
    goto :end
)

if "%choice%"=="2" (
    echo.
    echo Starting Bot Only...
    start "" "start_bot_only.bat"
    goto :end
)

if "%choice%"=="3" (
    echo.
    echo Starting Both Services...
    start "" "start_all.bat"
    goto :end
)

if "%choice%"=="4" (
    echo.
    echo Stopping All Services...
    start "" "stop_all.bat"
    goto :end
)

if "%choice%"=="5" (
    echo.
    echo Restarting Moderation...
    start "" "restart_moderation.bat"
    goto :end
)

if "%choice%"=="6" (
    echo.
    echo Goodbye!
    goto :end
)

echo.
echo Invalid choice! Please try again.
pause
goto :start

:end
echo.
echo Operation completed!
pause
