@echo off
echo ===================================================
echo   SexAppeal - Lock Public Access (Offline Mode)
echo ===================================================
echo.
echo Stopping the Nginx gateway container on the Moldovan server...
ssh root@91.208.206.35 "docker stop sexappeal_nginx"
echo.
echo ===================================================
echo ✅ The site is now OFFLINE to the public.
pause