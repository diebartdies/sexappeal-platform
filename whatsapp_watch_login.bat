@echo off
REM Scan WhatsApp QR once to enable server-down alerts (no CallMeBot needed)
cd /d "%~dp0"
echo.
echo Open WhatsApp on +5491178280156 and scan the QR when it appears below.
echo.
node scripts\whatsapp-watch-login.js
echo.
pause
