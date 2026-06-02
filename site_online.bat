@echo off
echo ===================================================
echo   SexAppeal - Restore Public Access (Online Mode)
echo ===================================================
echo.
echo Starting the Nginx gateway container on the Moldovan server...
ssh root@91.208.206.35 "docker start sexappeal_nginx"
echo.
echo ===================================================
echo ✅ The site is now ONLINE and accessible!
pause