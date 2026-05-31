@echo off
echo 🛑 Stopping existing development servers...
:: Forcefully kill background Node processes to free up ports
taskkill /F /IM node.exe /T >nul 2>&1

:: Small delay to ensure ports are fully released
timeout /t 1 /nobreak >nul

echo ===================================================
echo 🚀 Running Frontend Migrations and Updates...
echo ===================================================
node migrate-frontend.js

echo 🌟 Starting fresh development server in the background...
start /B node dev.js