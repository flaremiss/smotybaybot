@echo off
chcp 65001 >nul
title Shomy Bay - Railway Status Checker
color 0B

echo.
echo ========================================
echo    SHOMY BAY - RAILWAY STATUS CHECKER
echo ========================================
echo.

echo [INFO] Checking Railway deployment status...
echo.

set /p railway_url="Enter your Railway URL (https://your-project.railway.app): "

echo.
echo ========================================
echo           STATUS CHECK RESULTS
echo ========================================
echo.

echo [INFO] Checking Railway status...
curl -s "%railway_url%/status" > temp_status.json 2>nul

if exist temp_status.json (
    echo [SUCCESS] Railway is responding!
    echo.
    echo Status details:
    type temp_status.json
    echo.
    del temp_status.json
) else (
    echo [ERROR] Railway is not responding!
    echo [INFO] Check your Railway URL and deployment status
)

echo.
echo ========================================
echo           QUICK ACTIONS
echo ========================================
echo.

echo 1. Open Railway Dashboard
echo 2. Open Bot Status Page
echo 3. Open Moderation Panel
echo 4. Check ngrok Status
echo 5. View Railway Logs
echo 6. Exit
echo.

set /p action="Choose action (1-6): "

if "%action%"=="1" (
    echo [INFO] Opening Railway Dashboard...
    start "" "https://railway.app/dashboard"
    goto :end
)

if "%action%"=="2" (
    echo [INFO] Opening Bot Status...
    start "" "%railway_url%/status"
    goto :end
)

if "%action%"=="3" (
    set /p ngrok_url="Enter your ngrok URL (https://abc123.ngrok.io): "
    echo [INFO] Opening Moderation Panel...
    start "" "%ngrok_url%"
    goto :end
)

if "%action%"=="4" (
    echo [INFO] Opening ngrok Dashboard...
    start "" "http://127.0.0.1:4040"
    goto :end
)

if "%action%"=="5" (
    echo [INFO] Opening Railway Logs...
    start "" "https://railway.app/dashboard"
    echo [INFO] Go to your project → Deployments → View Logs
    goto :end
)

if "%action%"=="6" (
    goto :end
)

echo [ERROR] Invalid choice!
goto :end

:end
echo.
echo [INFO] Status check complete!
echo.
pause
