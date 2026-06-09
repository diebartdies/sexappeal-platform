echo ===================================================
echo   SexAppeal - Emergency Google Auth Fix
echo ===================================================
echo.
echo Connecting to Moldovan server to force library installation...
ssh root@91.208.206.35 "cd /opt/sexappeal-platform && docker run --rm -v $(pwd):/app -w /app node:22 npm install google-auth-library && docker compose build --no-cache app && docker compose up -d"
echo.
echo ===================================================
echo ✅ Server rebuilt successfully! The 502 error should be gone.
pause