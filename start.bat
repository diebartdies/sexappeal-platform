@echo off
echo ===================================================
echo  STOPPING ANY PREVIOUSLY RUNNING SERVER
echo  STOPPING ANY PREVIOUSLY RUNNING NODE.JS SERVER
echo ===================================================
set "PID="
for /f "tokens=5" %%a in ('netstat -a -n -o ^| find /I "LISTENING" ^| find ":5000"') do set "PID=%%a"

if defined PID (
    echo Killing process with PID %PID% listening on port 5000...
    taskkill /F /PID %PID%
) else (
    echo No previous server process found listening on port 5000.
)
echo Attempting to terminate all running node.exe processes...
taskkill /F /IM node.exe /T >nul 2>&1
echo Previous node processes terminated.
echo.
echo ===================================================
echo  INSTALLING/UPDATING DEPENDENCIES (npm install)
echo ===================================================
call npm install

echo.
echo ===================================================
echo  STARTING SERVER (node server.js)
echo ===================================================
echo.
start "SexAppeal Server" cmd /k "node server.js"

echo.
echo Waiting 3 seconds for the server to initialize...
timeout /t 3 /nobreak > nul
start http://localhost:5000
echo.
echo Your server is running in the new window. To stop it, close that window or press Ctrl+C inside it.