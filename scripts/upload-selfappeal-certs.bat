@echo off
setlocal EnableExtensions
echo ===================================================
echo SelfAppeal TLS — sync + upload to prod
echo ===================================================

set SERVER_USER=root
set SERVER_IP=91.208.206.35
set SERVER_PATH=/root/SexAppeal-platform
set SSH_OPTS=-o ConnectTimeout=60 -o ServerAliveInterval=15 -o ServerAliveCountMax=480

echo [1/4] Sync D:\Certs-Selfapeal -^> certbot layout...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sync-ssl-certs-selfappeal.ps1"
if errorlevel 1 exit /b 1

echo [2/4] Upload fullchain.pem + privkey.pem...
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%/certbot/conf/live/selfappeal.drsrv.net.ar"
if errorlevel 1 exit /b 1
scp %SSH_OPTS% "%~dp0certbot\conf\live\selfappeal.drsrv.net.ar\fullchain.pem" "%~dp0certbot\conf\live\selfappeal.drsrv.net.ar\privkey.pem" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/certbot/conf/live/selfappeal.drsrv.net.ar/
if errorlevel 1 exit /b 1

echo [3/4] Upload nginx.conf + selfappeal vhost scripts...
scp %SSH_OPTS% "%~dp0nginx.conf" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/nginx.conf
if errorlevel 1 exit /b 1
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%/nginx/conf.d"
scp %SSH_OPTS% "%~dp0nginx\conf.d\selfappeal.ssl.conf" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/nginx/conf.d/
if errorlevel 1 exit /b 1
scp %SSH_OPTS% "%~dp0scripts\nginx-write-selfappeal-conf.sh" "%~dp0scripts\nginx-emergency-fix.sh" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/scripts/
if errorlevel 1 exit /b 1

echo [4/4] Regenerate vhost, test nginx, restart...
ssh %SSH_OPTS% %SERVER_USER%@%SERVER_IP% "sed -i 's/\r$//' %SERVER_PATH%/scripts/nginx-write-selfappeal-conf.sh %SERVER_PATH%/scripts/nginx-emergency-fix.sh && chmod +x %SERVER_PATH%/scripts/nginx-write-selfappeal-conf.sh && bash %SERVER_PATH%/scripts/nginx-write-selfappeal-conf.sh %SERVER_PATH% && docker stop sexappeal_nginx 2>/dev/null || true && docker run --rm -v %SERVER_PATH%/nginx.conf:/etc/nginx/nginx.conf:ro -v %SERVER_PATH%/nginx/conf.d:/etc/nginx/conf.d:ro -v %SERVER_PATH%/certbot/conf/live:/etc/nginx/certs-live:ro nginx:alpine nginx -t && docker compose -f %SERVER_PATH%/docker-compose.yml up -d nginx && docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -E 'nginx|NAMES'"
if errorlevel 1 (
  echo.
  echo FAILED — try on server: bash %SERVER_PATH%/scripts/nginx-emergency-fix.sh
  exit /b 1
)

echo.
echo OK: selfappeal.drsrv.net.ar TLS deployed. Test: https://selfappeal.drsrv.net.ar/
endlocal
