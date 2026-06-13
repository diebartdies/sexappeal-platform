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
echo "Ensuring mongo 4.4 is running (no recreate, no pull)..."
$DC up -d --no-recreate --pull never mongo

echo "Building and recreating app only..."
$DC build app
$DC up -d --force-recreate --no-deps app

if docker ps --format '{{.Names}}' | grep -qx sexappeal_nginx; then
  echo "Restarting nginx for SSL/config reload..."
  docker restart sexappeal_nginx
else
  echo "Starting nginx..."
  $DC up -d --no-recreate nginx
fi

echo "Containers:"
$DC ps
