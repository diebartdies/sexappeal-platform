@echo off
REM Installs a Windows Scheduled Task on THIS PC (external monitor).
REM Do NOT install cron or tasks on 91.208.206.35 — alerts must come from outside.
echo.
echo === SexAppeal external server watch ===
echo Requires WATCH_CALLMEBOT_API_KEY in .env for WhatsApp alerts.
echo Setup: run test_watch_whatsapp.bat after adding the key.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-server-watch-task.ps1"
echo.
echo Running reachability check only (no WhatsApp during install)...
call "%~dp0check_server.bat"
echo.
echo If an old "down" state is stuck, run:  node scripts\server-watch.js --reset-state
pause
