#!/bin/bash
# Rebuild app container and restart nginx (called from upload_to_server.bat)
set -eu

DEPLOY_DIR="${1:-/root/SexAppeal-platform}"
cd "$DEPLOY_DIR"

if [ -f "$DEPLOY_DIR/scripts/disk-housekeeping.sh" ]; then
  echo "Running disk housekeeping before build..."
  bash "$DEPLOY_DIR/scripts/disk-housekeeping.sh" "$DEPLOY_DIR"
fi

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ERROR: neither docker compose nor docker-compose is available"
  exit 1
fi

replace_app_container() {
  echo "Replacing sexappeal_app container..."
  docker kill sexappeal_app 2>/dev/null || true
  if ! docker rm -f sexappeal_app 2>/dev/null; then
    echo "WARN: docker rm failed (permission denied?) — restarting Docker daemon..."
    systemctl restart docker
    sleep 5
    docker rm -f sexappeal_app 2>/dev/null || true
  fi
  $DC up -d --no-deps --pull never app
}

echo "Using: $DC"
echo "Ensuring mongo 4.4 is running (no recreate, no pull)..."
$DC up -d --no-recreate --pull never mongo

echo "Building app image..."
$DC build app

if ! replace_app_container; then
  echo "WARN: first app replace failed — retrying after Docker restart..."
  systemctl restart docker
  sleep 5
  $DC up -d --no-recreate --pull never mongo
  replace_app_container
fi

if docker ps --format '{{.Names}}' | grep -qx sexappeal_nginx; then
  echo "Restarting nginx for SSL/config reload..."
  docker restart sexappeal_nginx 2>/dev/null || $DC up -d --no-recreate nginx
else
  echo "Starting nginx..."
  $DC up -d --no-recreate nginx
fi

echo "Containers:"
$DC ps
