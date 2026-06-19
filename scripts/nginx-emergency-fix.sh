#!/bin/bash
# Stop nginx restart loop: replace stale certs-selfappeal / certs mounts with certs-live layout.
set -eu

DEPLOY_DIR="${1:-/root/SexAppeal-platform}"
cd "$DEPLOY_DIR"

echo "==> Stopping nginx..."
docker stop sexappeal_nginx 2>/dev/null || true

echo "==> Removing stale alias vhost snippet..."
rm -f "$DEPLOY_DIR/nginx/conf.d/selfappeal.ssl.conf"

if grep -q 'certs-selfappeal' "$DEPLOY_DIR/nginx.conf" 2>/dev/null; then
  echo "ERROR: nginx.conf still references certs-selfappeal (old layout)."
  echo "       Run upload_to_server.bat from Windows, or: git pull && bash scripts/deploy-restart.sh"
  exit 1
fi

if grep -q './certbot/conf/live/sexappeal.drsrv.net.ar:/etc/nginx/certs:' "$DEPLOY_DIR/docker-compose.yml" 2>/dev/null; then
  echo "ERROR: docker-compose.yml still uses old per-domain cert mounts."
  echo "       Deploy latest docker-compose.yml (certs-live single mount)."
  exit 1
fi

if [ -x "$DEPLOY_DIR/scripts/nginx-write-selfappeal-conf.sh" ]; then
  bash "$DEPLOY_DIR/scripts/nginx-write-selfappeal-conf.sh" "$DEPLOY_DIR"
fi

echo "==> Testing nginx config..."
docker run --rm \
  -v "$DEPLOY_DIR/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v "$DEPLOY_DIR/nginx/conf.d:/etc/nginx/conf.d:ro" \
  -v "$DEPLOY_DIR/certbot/conf/live:/etc/nginx/certs-live:ro" \
  nginx:alpine nginx -t

echo "==> Starting nginx..."
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi
$DC up -d nginx

sleep 2
docker ps --format 'table {{.Names}}\t{{.Status}}' | grep nginx || true
docker logs sexappeal_nginx --tail 5 2>&1 || true
echo "Done."
