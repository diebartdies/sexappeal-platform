@echo off
setlocal EnableExtensions
rem Upload TLS material to Moldova production VPS as bootstrap for fresh deploys only.
rem On existing servers certbot manages renewal (timer 1x/día); local PEM upload would break auto-renewal.
rem Called by upload_to_server.bat and fix-nginx-now.bat.

if not defined SERVER_USER set SERVER_USER=root
if not defined SERVER_IP set SERVER_IP=91.208.206.35
if not defined SERVER_PATH set SERVER_PATH=/root/SexAppeal-platform
if not defined SSH_OPTS set SSH_OPTS=-o ConnectTimeout=60 -o ServerAliveInterval=15 -o ServerAliveCountMax=480 -o TCPKeepAlive=yes

set SCRIPT_DIR=%~dp0
set REPO_ROOT=%SCRIPT_DIR%..

rem ── Check if certbot already manages certs on the server ──
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "systemctl is-active certbot.timer 2>/dev/null | grep -q active && test -f %SERVER_PATH%/certbot/conf/live/sexappeal.drsrv.net.ar/fullchain.pem"
if errorlevel 1 goto upload_certs
echo [TLS] Certbot timer active + certs present — skipping upload (server auto-renews). To force, run: ssh root@%SERVER_IP% certbot renew
goto :eof

:upload_certs
rem ── Bootstrap: upload local PEMs for a fresh server ──
echo [TLS] No certbot state detected on %SERVER_IP% — bootstrapping certs from local PEMs...

echo [TLS] Syncing SexAppeal certs locally (sexappeal.chain/key -^> fullchain.pem/privkey.pem)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%sync-ssl-certs.ps1"
if errorlevel 1 exit /b 1

echo [TLS] Syncing SelfAppeal certs locally (D:\Certs-Selfapeal -^> fullchain.pem/privkey.pem)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%sync-ssl-certs-selfappeal.ps1"
if errorlevel 1 exit /b 1

echo [TLS] Uploading SexAppeal cert + key to %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/certbot/conf/live/sexappeal.drsrv.net.ar/
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%/certbot/conf/live/sexappeal.drsrv.net.ar"
if errorlevel 1 exit /b 1
scp %SSH_OPTS% "%REPO_ROOT%\certbot\conf\live\sexappeal.drsrv.net.ar\fullchain.pem" "%REPO_ROOT%\certbot\conf\live\sexappeal.drsrv.net.ar\privkey.pem" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/certbot/conf/live/sexappeal.drsrv.net.ar/
if errorlevel 1 exit /b 1

echo [TLS] Uploading SelfAppeal cert + key to %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/certbot/conf/live/selfappeal.drsrv.net.ar/
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%/certbot/conf/live/selfappeal.drsrv.net.ar"
if errorlevel 1 exit /b 1
scp %SSH_OPTS% "%REPO_ROOT%\certbot\conf\live\selfappeal.drsrv.net.ar\fullchain.pem" "%REPO_ROOT%\certbot\conf\live\selfappeal.drsrv.net.ar\privkey.pem" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/certbot/conf/live/selfappeal.drsrv.net.ar/
if errorlevel 1 exit /b 1

echo [TLS] OK: both domains on Moldova prod (sexappeal + selfappeal, fullchain.pem + privkey.pem each).
endlocal
