@echo off
echo ===================================================
echo   1. Running Node.js Dependency Security Audit
echo ===================================================
call npm audit
echo.

echo ===================================================
echo   2. Running Docker Image Vulnerability Scan
echo ===================================================
:: Note: This uses Docker Scout, which is included with Docker Desktop
docker scout quickview nginx:alpine
docker scout quickview mongo:6.0
echo.

echo ===================================================
echo   Security audit complete!
echo ===================================================
pause