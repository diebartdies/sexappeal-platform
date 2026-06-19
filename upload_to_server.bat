setlocal EnableExtensions EnableDelayedExpansion

echo ===================================================
echo 🚀 SexAppeal - Automated Deployment Script v2.4
echo ===================================================
echo.

:: Server configuration
set SERVER_USER=root
set SERVER_IP=91.208.206.35
set SERVER_PATH=/root/SexAppeal-platform
set SSH_OPTS=-o ConnectTimeout=60 -o ServerAliveInterval=15 -o ServerAliveCountMax=480 -o TCPKeepAlive=yes

echo [1/7] Syncing SSL certs (sexappeal.chain/key -^> fullchain.pem/privkey.pem)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-ssl-certs.ps1"
if errorlevel 1 goto ssl_failed

echo [1b/7] Normalizing deploy script line endings (LF)...
powershell -NoProfile -Command "$paths=@('%~dp0scripts\deploy-extract.sh','%~dp0scripts\deploy-restart.sh','%~dp0scripts\disk-housekeeping.sh','%~dp0scripts\install-housekeeping-cron.sh','%~dp0scripts\git-backup-push.sh','%~dp0scripts\install-git-backup-cron.sh','%~dp0scripts\install-daily-backup-cron.sh'); foreach($p in $paths){ $t=[IO.File]::ReadAllText($p) -replace \"`r`n\",\"`n\" -replace \"`r\",\"\"; [IO.File]::WriteAllText($p,$t,(New-Object System.Text.UTF8Encoding $false)) }"
if errorlevel 1 goto line_endings_failed

echo [2/7] Compressing project files locally (ignoring heavy cache files)...
tar -czvf upload_package.tar.gz --exclude=node_modules --exclude=.git --exclude=.cache --exclude=upload_package.tar.gz --exclude=docker-compose.override.yml --exclude=.env --exclude=*.archive --exclude=*.tar.gz --exclude=certbot --exclude=app_bak.js --exclude=sexappeal_local_after_embed.archive .
if errorlevel 1 goto archive_failed

echo.
echo [3/7] Calculating local file checksum (SHA256)...
set "LOCAL_CHECKSUM="
for /f "skip=1 delims=" %%A in ('certutil -hashfile upload_package.tar.gz SHA256 2^>nul') do (
    if not defined LOCAL_CHECKSUM set "LOCAL_CHECKSUM=%%A"
)
set "LOCAL_CHECKSUM=!LOCAL_CHECKSUM: =!"
if "!LOCAL_CHECKSUM!"=="" goto checksum_failed
echo Local Checksum: !LOCAL_CHECKSUM!

echo.
echo [4/7] Uploading package and deploy helpers to the server...
scp %SSH_OPTS% upload_package.tar.gz %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
if errorlevel 1 goto upload_archive_failed

ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%/scripts"
if errorlevel 1 goto upload_scripts_failed

scp %SSH_OPTS% "%~dp0scripts\deploy-extract.sh" "%~dp0scripts\deploy-restart.sh" "%~dp0scripts\disk-housekeeping.sh" "%~dp0scripts\install-housekeeping-cron.sh" "%~dp0scripts\git-backup-push.sh" "%~dp0scripts\install-git-backup-cron.sh" "%~dp0scripts\install-daily-backup-cron.sh" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/scripts/
if errorlevel 1 goto upload_scripts_failed

ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "sed -i 's/\r$//' %SERVER_PATH%/scripts/deploy-extract.sh %SERVER_PATH%/scripts/deploy-restart.sh %SERVER_PATH%/scripts/disk-housekeeping.sh %SERVER_PATH%/scripts/install-housekeeping-cron.sh %SERVER_PATH%/scripts/git-backup-push.sh %SERVER_PATH%/scripts/install-git-backup-cron.sh %SERVER_PATH%/scripts/install-daily-backup-cron.sh"

echo.
echo [5/7] Verifying integrity and extracting on server...
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "chmod +x %SERVER_PATH%/scripts/deploy-extract.sh %SERVER_PATH%/scripts/deploy-restart.sh %SERVER_PATH%/scripts/disk-housekeeping.sh %SERVER_PATH%/scripts/install-housekeeping-cron.sh %SERVER_PATH%/scripts/git-backup-push.sh %SERVER_PATH%/scripts/install-git-backup-cron.sh %SERVER_PATH%/scripts/install-daily-backup-cron.sh && bash %SERVER_PATH%/scripts/deploy-extract.sh !LOCAL_CHECKSUM! %SERVER_PATH%"
if errorlevel 1 goto extract_failed

ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "sed -i 's/\r$//' %SERVER_PATH%/scripts/deploy-extract.sh %SERVER_PATH%/scripts/deploy-restart.sh %SERVER_PATH%/scripts/disk-housekeeping.sh %SERVER_PATH%/scripts/install-housekeeping-cron.sh %SERVER_PATH%/scripts/git-backup-push.sh %SERVER_PATH%/scripts/install-git-backup-cron.sh %SERVER_PATH%/scripts/install-daily-backup-cron.sh && chmod +x %SERVER_PATH%/scripts/deploy-extract.sh %SERVER_PATH%/scripts/deploy-restart.sh %SERVER_PATH%/scripts/disk-housekeeping.sh %SERVER_PATH%/scripts/install-housekeeping-cron.sh %SERVER_PATH%/scripts/git-backup-push.sh %SERVER_PATH%/scripts/install-git-backup-cron.sh %SERVER_PATH%/scripts/install-daily-backup-cron.sh"

echo.
echo [5b/7] Server disk housekeeping (before Docker build)...
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "bash %SERVER_PATH%/scripts/disk-housekeeping.sh %SERVER_PATH%"
if errorlevel 1 goto disk_failed

echo.
echo [6/7] Building and restarting containers (app + nginx for SSL)...
echo     This step takes about 4-8 minutes (npm install + image export). Do NOT press Ctrl+C.
ssh %SSH_OPTS% -o ServerAliveCountMax=480 %SERVER_USER%@%SERVER_IP% "bash %SERVER_PATH%/scripts/deploy-restart.sh %SERVER_PATH%"
if errorlevel 1 goto docker_failed

echo 🚀 DEPLOYMENT SUCCEEDED! Application is now running the new code.
goto cleanup

:ssl_failed
echo ❌ ERROR: SSL cert sync failed.
goto cleanup

:line_endings_failed
echo ❌ ERROR: Failed to normalize deploy script line endings.
goto cleanup

:archive_failed
echo ❌ ERROR: Failed to create archive.
goto cleanup

:checksum_failed
echo ❌ ERROR: Could not compute local checksum.
goto cleanup

:upload_archive_failed
echo ❌ ERROR: Failed to upload archive.
goto cleanup

:upload_scripts_failed
echo ❌ ERROR: Failed to upload deploy helper scripts (or create scripts dir on server).
goto cleanup

:extract_failed
echo ❌ ERROR: Step 5 failed - checksum mismatch or extract error.
goto cleanup

:disk_failed
echo ❌ ERROR: Disk critically low after cleanup. Run disk_housekeeping.bat aggressive on server, then retry.
goto cleanup

:docker_failed
echo ❌ ERROR: Step 6 failed - docker build/start error.
goto cleanup

:cleanup
echo.
echo Cleaning up local temporary files...
if exist upload_package.tar.gz del upload_package.tar.gz

echo.
echo [7/7] Backing up to GitHub (non-interactive)...
set GIT_TERMINAL_PROMPT=0
set GCM_INTERACTIVE=never
set GIT_OPTIONAL_LOCKS=0
git add .
git diff --cached --quiet
if errorlevel 1 goto git_commit
echo ℹ️ No git changes to commit — skipping commit/push.
goto end

:git_commit
git commit -m "Automated deployment update"
if errorlevel 1 goto git_commit_failed
echo n| git -c gc.auto=0 push origin HEAD 2>&1
if errorlevel 1 goto git_push_failed
echo ✅ GitHub backup successful!
goto end

:git_commit_failed
echo ⚠️ WARNING: git commit failed. Deploy on server is still OK.
goto end

:git_push_failed
echo ⚠️ WARNING: GitHub push failed (often a Windows .git file lock). Push manually if needed.
echo          Production deploy already succeeded — no action required for the live site.
goto end

:end
echo.
echo ===================================================
echo ✅ Script finished.
echo ===================================================
pause
