@echo off
setlocal EnableExtensions

echo ===================================================
echo SexAppeal - Server disk housekeeping
echo ===================================================
echo.

set SERVER_USER=root
set SERVER_IP=91.208.206.35
set SERVER_PATH=/root/SexAppeal-platform

if /I "%~1"=="aggressive" (
    set MODE=AGGRESSIVE=1
    echo Mode: AGGRESSIVE ^(unused Docker images too^)
) else (
    set MODE=
    echo Mode: LIGHT ^(build cache, dangling images, logs^)
)

echo.
scp "%~dp0scripts\disk-housekeeping.sh" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/scripts/
if errorlevel 1 (
    echo ERROR: Failed to upload housekeeping script.
    exit /b 1
)

ssh %SERVER_USER%@%SERVER_IP% "sed -i 's/\r$//' %SERVER_PATH%/scripts/disk-housekeeping.sh && chmod +x %SERVER_PATH%/scripts/disk-housekeeping.sh && %MODE% bash %SERVER_PATH%/scripts/disk-housekeeping.sh %SERVER_PATH%"
if errorlevel 1 (
    echo ERROR: Housekeeping failed or disk critically low.
    exit /b 1
)

echo.
echo Done.
pause
