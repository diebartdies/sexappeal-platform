#!/bin/bash
# Rebuild app container and restart nginx (called from upload_to_server.bat)
set -eu

DEPLOY_DIR="${1:-/root/SexAppeal-platform}"
cd "$DEPLOY_DIR"

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ERROR: neither docker compose nor docker-compose is available"
  exit 1
fi

echo "Using: $DC"
$DC rm -fs app 2>/dev/null || true
$DC up --build -d

if docker ps --format '{{.Names}}' | grep -qx sexappeal_nginx; then
  docker restart sexappeal_nginx
else
  echo "WARN: sexappeal_nginx not running; trying compose restart nginx..."
  $DC restart nginx
fi

echo "Containers:"
$DC ps
