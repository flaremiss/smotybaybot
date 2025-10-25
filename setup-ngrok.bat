@echo off
chcp 65001 >nul
title Shomy Bay - Ngrok Setup
color 0D

echo.
echo ========================================
echo    SHOMY BAY - NGROK SETUP
echo ========================================
echo.

echo [INFO] Checking ngrok installation...
if not exist "ngrok.exe" (
    echo [ERROR] ngrok.exe not found!
    echo [INFO] Please download ngrok from: https://ngrok.com/download
    echo [INFO] Place ngrok.exe in this folder and run again.
    pause
    exit /b 1
)

echo [INFO] Starting ngrok tunnel...
echo [INFO] This will create a public URL for your moderation panel
echo [INFO] Copy the HTTPS URL and use it in Railway settings
echo.

ngrok http 3000

echo.
echo [INFO] Ngrok tunnel stopped.
pause
