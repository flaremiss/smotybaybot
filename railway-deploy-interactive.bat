@echo off
chcp 65001 >nul
title Shomy Bay - Railway Deploy Assistant
color 0A

echo.
echo ========================================
echo    SHOMY BAY - RAILWAY DEPLOY ASSISTANT
echo ========================================
echo.

echo [INFO] This assistant will guide you through Railway deployment
echo [INFO] Make sure you have the railway-deploy folder ready
echo.

:menu
echo.
echo ========================================
echo           DEPLOYMENT STEPS
echo ========================================
echo.
echo 1. Check files and prepare
echo 2. Create GitHub repository
echo 3. Deploy to Railway
echo 4. Set environment variables
echo 5. Setup ngrok tunnel
echo 6. Start moderation panel
echo 7. Test everything
echo 8. View status and logs
echo 9. Exit
echo.

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto :check_files
if "%choice%"=="2" goto :github_setup
if "%choice%"=="3" goto :railway_deploy
if "%choice%"=="4" goto :env_variables
if "%choice%"=="5" goto :ngrok_setup
if "%choice%"=="6" goto :start_moderation
if "%choice%"=="7" goto :test_all
if "%choice%"=="8" goto :view_status
if "%choice%"=="9" goto :exit

echo.
echo Invalid choice! Please try again.
goto :menu

:check_files
echo.
echo ========================================
echo           STEP 1: CHECK FILES
echo ========================================
echo.

echo [INFO] Checking railway-deploy folder...
if not exist "railway-deploy" (
    echo [ERROR] railway-deploy folder not found!
    echo [INFO] Please create the folder and add the deployment files
    pause
    goto :menu
)

echo [INFO] Checking required files...
if not exist "railway-deploy\bot-remote.js" (
    echo [ERROR] bot-remote.js not found!
    pause
    goto :menu
)

if not exist "railway-deploy\package.json" (
    echo [ERROR] package.json not found!
    pause
    goto :menu
)

if not exist "railway-deploy\keep-alive.js" (
    echo [ERROR] keep-alive.js not found!
    pause
    goto :menu
)

echo [SUCCESS] All required files found!
echo.
echo Files in railway-deploy:
dir railway-deploy\*.js railway-deploy\*.json
echo.
pause
goto :menu

:github_setup
echo.
echo ========================================
echo        STEP 2: GITHUB REPOSITORY
echo ========================================
echo.

echo [INFO] GitHub repository setup
echo.
echo 1. Go to https://github.com
echo 2. Click "New repository"
echo 3. Repository name: shomy-bay-bot-railway
echo 4. Description: Shomy Bay Telegram Bot for Railway
echo 5. Make it PUBLIC (required for free Railway)
echo 6. DO NOT initialize with README
echo 7. Click "Create repository"
echo.
echo 8. Upload files from railway-deploy folder:
echo    - bot-remote.js
echo    - package.json
echo    - keep-alive.js
echo    - railway.json
echo    - README-DEPLOY.md
echo.
echo 9. Commit message: "Initial commit: Railway deployment files"
echo 10. Click "Commit changes"
echo.

set /p github_done="Have you completed GitHub setup? (y/n): "
if /i "%github_done%"=="y" (
    echo [SUCCESS] GitHub repository ready!
) else (
    echo [INFO] Please complete GitHub setup first
)
echo.
pause
goto :menu

:railway_deploy
echo.
echo ========================================
echo         STEP 3: RAILWAY DEPLOY
echo ========================================
echo.

echo [INFO] Railway deployment
echo.
echo 1. Go to https://railway.app
echo 2. Click "Login with GitHub"
echo 3. Authorize Railway access
echo 4. Click "New Project"
echo 5. Select "Deploy from GitHub repo"
echo 6. Find your repository: shomy-bay-bot-railway
echo 7. Click "Deploy Now"
echo.
echo Railway will automatically:
echo - Detect Node.js project
echo - Install dependencies
echo - Run npm start
echo - Create public URL
echo.
echo Wait for deployment to complete (2-5 minutes)
echo.

set /p railway_done="Have you completed Railway deployment? (y/n): "
if /i "%railway_done%"=="y" (
    echo [SUCCESS] Railway deployment complete!
    echo.
    set /p railway_url="Enter your Railway URL (https://your-project.railway.app): "
    echo [INFO] Railway URL saved: %railway_url%
) else (
    echo [INFO] Please complete Railway deployment first
)
echo.
pause
goto :menu

:env_variables
echo.
echo ========================================
echo      STEP 4: ENVIRONMENT VARIABLES
echo ========================================
echo.

echo [INFO] Setting up environment variables in Railway
echo.
echo In Railway dashboard:
echo 1. Click on your project
echo 2. Go to "Variables" tab
echo 3. Click "New Variable"
echo.
echo Add these variables:
echo.
echo Variable 1:
echo Name: BOT_TOKEN
echo Value: your_bot_token_from_BotFather
echo.
echo Variable 2:
echo Name: ADMIN_CHAT_ID
echo Value: your_telegram_id
echo.
echo Variable 3:
echo Name: WEBHOOK_URL
echo Value: %railway_url%
echo.
echo Variable 4:
echo Name: MODERATION_URL
echo Value: https://your-ngrok-url.ngrok.io (update after ngrok setup)
echo.

set /p env_done="Have you set all environment variables? (y/n): "
if /i "%env_done%"=="y" (
    echo [SUCCESS] Environment variables set!
    echo [INFO] Railway will automatically restart with new variables
) else (
    echo [INFO] Please set environment variables first
)
echo.
pause
goto :menu

:ngrok_setup
echo.
echo ========================================
echo         STEP 5: NGROK SETUP
echo ========================================
echo.

echo [INFO] Ngrok tunnel setup
echo.
echo 1. Download ngrok from https://ngrok.com/download
echo 2. Extract ngrok.exe to this folder
echo 3. Create ngrok account at https://ngrok.com
echo 4. Get authtoken from ngrok dashboard
echo 5. Run: ngrok config add-authtoken YOUR_AUTHTOKEN
echo 6. Run: ngrok http 3000
echo.
echo You will see:
echo Forwarding    https://abc123.ngrok.io -> http://localhost:3000
echo.
echo Copy the HTTPS URL (https://abc123.ngrok.io)
echo.

set /p ngrok_done="Have you completed ngrok setup? (y/n): "
if /i "%ngrok_done%"=="y" (
    echo [SUCCESS] Ngrok tunnel ready!
    echo.
    set /p ngrok_url="Enter your ngrok URL (https://abc123.ngrok.io): "
    echo [INFO] Ngrok URL saved: %ngrok_url%
    echo.
    echo [INFO] Update MODERATION_URL in Railway with: %ngrok_url%
) else (
    echo [INFO] Please complete ngrok setup first
)
echo.
pause
goto :menu

:start_moderation
echo.
echo ========================================
echo       STEP 6: START MODERATION
echo ========================================
echo.

echo [INFO] Starting moderation panel
echo.
echo 1. Make sure ngrok is running
echo 2. Update MODERATION_URL in Railway with your ngrok URL
echo 3. Start moderation panel
echo.

set /p start_mod="Start moderation panel now? (y/n): "
if /i "%start_mod%"=="y" (
    echo [INFO] Starting moderation panel...
    start "Moderation Panel" cmd /k "start_moderation.bat"
    echo [SUCCESS] Moderation panel started!
) else (
    echo [INFO] You can start it later with: start_moderation.bat
)
echo.
pause
goto :menu

:test_all
echo.
echo ========================================
echo           STEP 7: TEST ALL
echo ========================================
echo.

echo [INFO] Testing your deployment
echo.

echo Test 1: Railway status
echo Opening: %railway_url%/status
start "" "%railway_url%/status"
echo.

echo Test 2: Ngrok moderation panel
echo Opening: %ngrok_url%
start "" "%ngrok_url%"
echo.

echo Test 3: Telegram bot
echo [INFO] Find your bot in Telegram and send /start
echo [INFO] Check if bot responds
echo.

echo Test 4: Railway logs
echo [INFO] Check Railway dashboard for logs
echo [INFO] Look for: "🚀 Запуск Shomy Bay Bot (Remote Version)"
echo.

set /p test_done="Have you completed all tests? (y/n): "
if /i "%test_done%"=="y" (
    echo [SUCCESS] All tests completed!
) else (
    echo [INFO] Please complete all tests
)
echo.
pause
goto :menu

:view_status
echo.
echo ========================================
echo        STEP 8: VIEW STATUS & LOGS
echo ========================================
echo.

echo [INFO] Status and monitoring
echo.

echo 1. Railway Dashboard:
echo    https://railway.app/dashboard
echo.

echo 2. Your bot status:
echo    %railway_url%/status
echo.

echo 3. Moderation panel:
echo    %ngrok_url%
echo.

echo 4. Ngrok dashboard:
echo    http://127.0.0.1:4040
echo.

echo 5. Local moderation:
echo    http://localhost:3000
echo.

echo [INFO] Opening status page...
start "" "%railway_url%/status"
echo.
pause
goto :menu

:exit
echo.
echo ========================================
echo           DEPLOYMENT COMPLETE!
echo ========================================
echo.

echo [SUCCESS] Your Shomy Bay Bot is now running on Railway!
echo.
echo Summary:
echo - Bot: Running on Railway (free)
echo - Moderation: Running on your PC via ngrok
echo - Cost: $0/month
echo.
echo Links:
echo - Bot Status: %railway_url%/status
echo - Moderation: %ngrok_url%
echo - Railway Dashboard: https://railway.app/dashboard
echo.
echo [INFO] Keep ngrok running for moderation panel access
echo [INFO] Railway will handle bot hosting automatically
echo.
echo Thank you for using Shomy Bay Bot!
echo.
pause
exit
