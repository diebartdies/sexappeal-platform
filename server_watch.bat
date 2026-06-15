@echo off
REM Run on your Windows PC only — NOT on the virtual server
cd /d "%~dp0"
node scripts\server-watch.js
exit /b %ERRORLEVEL%