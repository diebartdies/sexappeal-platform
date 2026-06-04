@echo off
setlocal

echo ===================================================
echo 📥 SexAppeal - Reverse Sync (Production to Local)
echo ===================================================
echo.

echo [1/4] Compressing production files on the server...
ssh root@91.208.206.35 "cd /root/SexAppeal-platform && tar -czvf download_package.tar.gz --exclude=node_modules --exclude=.git --exclude=public/uploads --exclude=.cache --exclude=download_package.tar.gz ."

echo.
echo [2/4] Downloading package to local machine...
scp root@91.208.206.35:/root/SexAppeal-platform/download_package.tar.gz .

echo.
echo [3/4] Extracting files locally (overwriting older files)...
tar -xzvf download_package.tar.gz

echo.
echo [4/4] Cleaning up temporary files...
del download_package.tar.gz
ssh root@91.208.206.35 "cd /root/SexAppeal-platform && rm download_package.tar.gz"

echo.
echo ===================================================
echo ✅ SYNC COMPLETE! Your local environment is now perfectly synced with Production.
echo ===================================================
pause