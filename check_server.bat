@echo off
REM Run on your Windows PC only — NOT via SSH on 91.208.206.35
cd /d "%~dp0"
node scripts\server-watch.js --check
exit /b %ERRORLEVEL%