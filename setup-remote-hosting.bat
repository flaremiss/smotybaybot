@echo off
chcp 65001 >nul
title Shomy Bay - Remote Hosting Setup
color 0F

echo.
echo ========================================
echo    SHOMY BAY - REMOTE HOSTING SETUP
echo ========================================
echo.

echo [INFO] This script will help you set up remote hosting
echo [INFO] Bot will run on Railway (free), moderation on your PC
echo.

echo Step 1: Prepare files for Railway
echo [INFO] Copying files to railway-deploy folder...
if not exist "railway-deploy" mkdir railway-deploy
copy "railway-deploy\*" "railway-deploy\" /Y >nul 2>&1
echo [SUCCESS] Files prepared for Railway
echo.

echo Step 2: GitHub Repository
echo [INFO] You need to create a GitHub repository
echo [INFO] Upload the railway-deploy folder contents to GitHub
echo [INFO] Repository URL: https://github.com/yourusername/your-repo
echo.

echo Step 3: Railway Setup
echo [INFO] Go to https://railway.app
echo [INFO] Sign in with GitHub
echo [INFO] Create new project from GitHub repo
echo [INFO] Select your repository
echo.

echo Step 4: Environment Variables
echo [INFO] In Railway project settings, add these variables:
echo.
echo BOT_TOKEN=your_bot_token_here
echo ADMIN_CHAT_ID=your_telegram_id_here
echo WEBHOOK_URL=https://your-project.railway.app
echo MODERATION_URL=https://your-ngrok-url.ngrok.io
echo.

echo Step 5: Ngrok Setup
echo [INFO] Download ngrok from https://ngrok.com/download
echo [INFO] Place ngrok.exe in this folder
echo [INFO] Run setup-ngrok.bat to start tunnel
echo.

echo Step 6: Start Moderation
echo [INFO] Run start_moderation.bat on your PC
echo [INFO] Update MODERATION_URL in Railway with ngrok URL
echo.

echo ========================================
echo    SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Create GitHub repository
echo 2. Upload railway-deploy files
echo 3. Deploy to Railway
echo 4. Set environment variables
echo 5. Start ngrok tunnel
echo 6. Start moderation panel
echo.
echo For detailed instructions, see:
echo railway-deploy\README-DEPLOY.md
echo.
pause
