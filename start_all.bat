@echo off
echo Starting bot and moderation server...

echo Starting bot...
start "Bot" cmd /k "node bot.js"

timeout /t 2 /nobreak >nul

echo Starting moderation server...
start "Moderation Server" cmd /k "node moderation_server.js"

echo Both services started!
echo Bot: Check the "Bot" window
echo Web panel: http://localhost:3000
pause









