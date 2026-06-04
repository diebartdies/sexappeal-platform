@echo off
echo ===================================================
echo 📸 Syncing Local Test Photos to Production
echo ===================================================
echo.
scp -r public/uploads root@91.208.206.35:/root/SexAppeal-platform/public/
echo ✅ Photos synced to production!
pause