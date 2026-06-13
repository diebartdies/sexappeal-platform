setlocal

echo ===================================================
echo 🚀 SexAppeal - Automated Deployment Script v2.1
echo ===================================================
echo.

:: Define your server configuration here
set SERVER_USER=root
set SERVER_IP=91.208.206.35

echo [1/7] Syncing SSL certs (sexappeal.chain/key -> fullchain.pem/privkey.pem)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-ssl-certs.ps1"
if %errorlevel% neq 0 (
    echo ❌ ERROR: SSL cert sync failed.
    goto end
)

echo [2/7] Compressing project files locally (ignoring heavy cache files)...
tar -czvf upload_package.tar.gz --exclude=node_modules --exclude=.git --exclude=.cache --exclude=upload_package.tar.gz --exclude=docker-compose.override.yml --exclude=.env .
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to create archive.
    goto end
)

echo.
echo [3/7] Calculating local file checksum (SHA256)...
for /f "tokens=*" %%A in ('certutil -hashfile upload_package.tar.gz SHA256 ^| findstr /v "hash CertUtil"') do set "LOCAL_CHECKSUM=%%A"
echo Local Checksum: %LOCAL_CHECKSUM%

echo.
echo [4/7] Uploading package to the server...
scp upload_package.tar.gz %SERVER_USER%@%SERVER_IP%:/root/SexAppeal-platform/
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to upload file.
    goto cleanup
)

echo.
echo [5/7] Verifying integrity and extracting on server...
ssh %SERVER_USER%@%SERVER_IP% "cd /root/SexAppeal-platform && REMOTE_CHECKSUM=$(sha256sum upload_package.tar.gz | awk '{print $1}') && echo Server Checksum: $REMOTE_CHECKSUM && if [ \"$REMOTE_CHECKSUM\" == \"%LOCAL_CHECKSUM%\" ]; then echo '✅ Checksums match. Proceeding with extraction...' && tar -xzvf upload_package.tar.gz --warning=no-unknown-keyword && rm upload_package.tar.gz && echo '✅ Files extracted successfully.'; else echo '❌ CHECKSUM MISMATCH! Deployment aborted.' && rm upload_package.tar.gz && exit 1; fi"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Deployment aborted during verification/extraction.
    goto cleanup
)

echo.
echo [6/7] Building and restarting containers (app + nginx for SSL)...
ssh %SERVER_USER%@%SERVER_IP% "cd /root/SexAppeal-platform && docker-compose rm -fs app && docker-compose up --build -d && docker restart sexappeal_nginx"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to build and start containers.
) else (
    echo 🚀 DEPLOYMENT SUCCEEDED! Application is now running the new code.
)

:cleanup
echo.
echo Cleaning up local temporary files...
del upload_package.tar.gz

echo.
echo [7/7] Backing up to GitHub...
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
