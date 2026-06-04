@echo off
setlocal

echo ===================================================
echo 🚀 SexAppeal - Automated Deployment Script v2.1
echo ===================================================
echo.

echo [1/6] Compressing project files (ignoring heavy cache files)...
tar -czvf upload_package.tar.gz --exclude=node_modules --exclude=.git --exclude=public/uploads --exclude=.cache --exclude=upload_package.tar.gz .
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to create archive.
    goto end
)

echo.
echo [2/6] Calculating local file checksum (SHA256)...
for /f "tokens=*" %%A in ('certutil -hashfile upload_package.tar.gz SHA256 ^| findstr /v "hash CertUtil"') do set "LOCAL_CHECKSUM=%%A"
echo Local Checksum: %LOCAL_CHECKSUM%

echo.
echo [3/6] Uploading package to the server...
scp upload_package.tar.gz root@91.208.206.35:/root/SexAppeal-platform/
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to upload file.
    goto cleanup
)

echo.
echo [4/6] Verifying integrity and deploying on server...
ssh root@91.208.206.35 "cd /root/SexAppeal-platform && REMOTE_CHECKSUM=$(sha256sum upload_package.tar.gz | awk '{print $1}') && echo Server Checksum: $REMOTE_CHECKSUM && if [ \"$REMOTE_CHECKSUM\" == \"%LOCAL_CHECKSUM%\" ]; then echo '✅ Checksums match. Proceeding with deployment...' && tar -xzvf upload_package.tar.gz && rm upload_package.tar.gz && echo '✅ Files extracted successfully.' && docker restart sexappeal_app && echo '🚀 DEPLOYMENT SUCCEEDED! Application is now running the new code.'; else echo '❌ CHECKSUM MISMATCH! Deployment aborted.' && rm upload_package.tar.gz && exit 1; fi"

:cleanup
echo.
echo [5/6] Cleaning up local temporary files...
del upload_package.tar.gz

echo.
echo [6/6] Backing up to GitHub...
git add .
git commit -m "Automated deployment update"
git push
if %errorlevel% neq 0 (
    echo ⚠️ WARNING: GitHub backup failed. You may need to push manually.
) else (
    echo ✅ GitHub backup successful!
)

:end
echo.
echo ===================================================
echo ✅ Script finished.
echo ===================================================
pause
