@echo off
REM Sends one test WhatsApp to +5491178280156 (needs WATCH_CALLMEBOT_API_KEY in .env)
cd /d "%~dp0"
node scripts\test-watch-alert.js
pause
