echo ===================================================
echo 🔄 Rebuilding Local SexAppeal Environment...
echo ===================================================
echo.
docker-compose down
docker-compose build
docker-compose up -d
echo.
echo ✅ Local environment rebuilt and updated!
pause