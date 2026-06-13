setlocal EnableExtensions

echo ===================================================
echo 🚀 SexAppeal - Automated Deployment Script v2.2
echo ===================================================
echo.

:: Server configuration
set SERVER_USER=root
set SERVER_IP=91.208.206.35
set SERVER_PATH=/root/SexAppeal-platform

echo [1/7] Syncing SSL certs (sexappeal.chain/key -^> fullchain.pem/privkey.pem)...
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
echo [3/7] Calculating local file checksum (SHA256, lowercase)...
for /f "delims=" %%A in ('powershell -NoProfile -Command "(Get-FileHash -Path 'upload_package.tar.gz' -Algorithm SHA256).Hash.ToLower()"') do set "LOCAL_CHECKSUM=%%A"
if not defined LOCAL_CHECKSUM (
    echo ❌ ERROR: Could not compute local checksum.
    goto cleanup
)
echo Local Checksum: %LOCAL_CHECKSUM%

echo.
echo [4/7] Uploading package and deploy helpers to the server...
scp upload_package.tar.gz %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to upload archive.
    goto cleanup
)
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%/scripts"
scp "%~dp0scripts\deploy-extract.sh" "%~dp0scripts\deploy-restart.sh" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/scripts/
if %errorlevel% neq 0 (
    echo ❌ ERROR: Failed to upload deploy helper scripts.
    goto cleanup
)

echo.
echo [5/7] Verifying integrity and extracting on server...
ssh %SERVER_USER%@%SERVER_IP% "chmod +x %SERVER_PATH%/scripts/deploy-extract.sh %SERVER_PATH%/scripts/deploy-restart.sh && bash %SERVER_PATH%/scripts/deploy-extract.sh %LOCAL_CHECKSUM% %SERVER_PATH%"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Step 5 failed — checksum mismatch or extract error.
    echo    Common cause: Windows certutil UPPERCASE vs Linux lowercase (fixed in v2.2).
    goto cleanup
)

echo.
echo [6/7] Building and restarting containers (app + nginx for SSL)...
ssh %SERVER_USER%@%SERVER_IP% "bash %SERVER_PATH%/scripts/deploy-restart.sh %SERVER_PATH%"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Step 6 failed — docker build/start error.
    echo    Try on server: cd %SERVER_PATH% ^&^& docker compose ps ^&^& docker compose logs --tail=30 app
    goto cleanup
)

echo 🚀 DEPLOYMENT SUCCEEDED! Application is now running the new code.

:cleanup
echo.
echo Cleaning up local temporary files...
if exist upload_package.tar.gz del upload_package.tar.gz

echo.
echo [7/7] Backing up to GitHub...
git add .
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo ℹ️ No git changes to commit — skipping commit/push.
) else (
    git commit -m "Automated deployment update"
    if %errorlevel% neq 0 (
        echo ⚠️ WARNING: git commit failed.
    ) else (
        git push
        if %errorlevel% neq 0 (
            echo ⚠️ WARNING: GitHub push failed. Push manually if needed.
        ) else (
            echo ✅ GitHub backup successful!
        )
    )
)

:end
echo.
echo ===================================================
echo ✅ Script finished.
echo ===================================================
pause
