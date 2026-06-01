@echo off
echo ===================================================
echo   SexAppeal Platform - Secure Database Backup
echo ===================================================
echo.

:: Generate a clean timestamp (YYYY-MM-DD_HH-mm-ss) using PowerShell
for /f "delims=" %%a in ('powershell -Command "Get-Date -format 'yyyy-MM-dd_HH-mm-ss'"') do set TIMESTAMP=%%a
set BACKUP_FILE=sexappeal_backup_%TIMESTAMP%.archive

echo Connecting to Moldovan server to generate backup...

:: 1. Run mongodump inside the live MongoDB container
ssh root@91.208.206.35 "docker exec sexappeal_mongo sh -c 'mongodump --archive=/tmp/sexappeal_backup.archive --gzip --db sexappeal'"

:: 2. Copy the backup file from the container to the Linux server's host file system
ssh root@91.208.206.35 "docker cp sexappeal_mongo:/tmp/sexappeal_backup.archive /tmp/sexappeal_backup.archive"

:: 3. Securely download the backup to your local Windows machine
echo Downloading backup to your computer...
scp root@91.208.206.35:/tmp/sexappeal_backup.archive .\%BACKUP_FILE%

:: 4. Clean up the temporary files on the remote server
ssh root@91.208.206.35 "docker exec sexappeal_mongo rm /tmp/sexappeal_backup.archive && rm /tmp/sexappeal_backup.archive"

echo.
echo ===================================================
echo ✅ Backup successfully downloaded as '%BACKUP_FILE%'!
echo ===================================================