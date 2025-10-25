@echo off
echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting bot...
node bot.js

pause

