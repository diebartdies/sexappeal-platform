#!/bin/bash
# Rebuild app container and restart nginx (called from upload_to_server.bat)
set -eu

DEPLOY_DIR="${1:-/root/SexAppeal-platform}"
cd "$DEPLOY_DIR"

ensure_docker() {
  if [ -x /usr/bin/docker ]; then
    export PATH="/usr/bin:/usr/sbin:/bin:$PATH"
  fi
  unset DOCKER_HOST
  if [ ! -S /var/run/docker.sock ]; then
    echo "WARN: /var/run/docker.sock missing — restarting Docker..."
    systemctl restart docker.socket docker 2>/dev/null || systemctl restart docker
    sleep 3
  fi
  if ! docker info >/dev/null 2>&1; then
    echo "ERROR: cannot reach Docker API (common after 'snap remove docker')."
    echo "Try: systemctl restart docker.socket docker && ls -la /var/run/docker.sock"
    exit 1
  fi
}

app_resolves_mongo() {
  docker exec sexappeal_app getent hosts mongo >/dev/null 2>&1
}

wait_for_mongo_healthy() {
  until docker inspect -f '{{.State.Health.Status}}' sexappeal_mongo 2>/dev/null | grep -qx healthy; do
    echo "Waiting for mongo 4.4 to become healthy..."
    sleep 3
  done
}

# Recreate all containers on one compose network (named volume sexappeal_mongo_data is kept).
reconcile_stack_network() {
  echo "WARN: app cannot resolve hostname 'mongo' — reconciling stack (DB volume preserved)..."
  $DC down
  $DC up -d --pull never mongo
  wait_for_mongo_healthy
  $DC build app
  $DC up -d --pull never app nginx
}

ensure_docker

SELFAPPEAL_CERT="$DEPLOY_DIR/certbot/conf/live/selfappeal.drsrv.net.ar/fullchain.pem"
FCWA_CERT="$DEPLOY_DIR/certbot/conf/live/fcwa.drsrv.net.ar/fullchain.pem"
if [ ! -f "$SELFAPPEAL_CERT" ] && [ -f "$FCWA_CERT" ]; then
  echo "WARN: selfappeal cert missing — symlinking fcwa cert so nginx can start..."
  mkdir -p "$DEPLOY_DIR/certbot/conf/live/selfappeal.drsrv.net.ar"
  ln -sf "../fcwa.drsrv.net.ar/fullchain.pem" "$DEPLOY_DIR/certbot/conf/live/selfappeal.drsrv.net.ar/fullchain.pem"
  ln -sf "../fcwa.drsrv.net.ar/privkey.pem" "$DEPLOY_DIR/certbot/conf/live/selfappeal.drsrv.net.ar/privkey.pem"
fi

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
    systemctl restart docker.socket docker 2>/dev/null || systemctl restart docker
    sleep 5
    docker rm -f sexappeal_app 2>/dev/null || true
  fi
  # Do not use --no-deps: app must join the compose network to resolve "mongo".
  $DC up -d --pull never app
}

echo "Using: $DC"
echo "Ensuring mongo 4.4 is running (no recreate, no pull)..."
$DC up -d --no-recreate --pull never mongo

echo "Building app image (Twilio optional — INSTALL_TWILIO=0 by default)..."
mkdir -p "$DEPLOY_DIR/.cache"
BUILD_LOG="$DEPLOY_DIR/.cache/docker-build.log"
if ! $DC build app 2>&1 | tee "$BUILD_LOG"; then
  echo "ERROR: docker build failed. Tail of log:"
  tail -n 40 "$BUILD_LOG" || true
  exit 1
fi

if ! replace_app_container; then
  echo "WARN: first app replace failed — retrying after Docker restart..."
  systemctl restart docker.socket docker 2>/dev/null || systemctl restart docker
  sleep 5
  $DC up -d --no-recreate --pull never mongo
  replace_app_container
fi

if ! app_resolves_mongo; then
  reconcile_stack_network
elif ! docker logs sexappeal_app 2>&1 | tail -20 | grep -q 'MongoDB Connected'; then
  echo "Waiting for app to connect to mongo..."
  sleep 15
  if ! docker logs sexappeal_app 2>&1 | tail -30 | grep -q 'MongoDB Connected'; then
    reconcile_stack_network
  fi
fi

if docker ps --format '{{.Names}}' | grep -qx sexappeal_nginx; then
  echo "Restarting nginx for SSL/config reload..."
  docker restart sexappeal_nginx 2>/dev/null || $DC up -d --no-recreate nginx
else
  echo "Starting nginx..."
  $DC up -d --pull never nginx
fi

echo "Containers:"
$DC ps

if app_resolves_mongo && docker logs sexappeal_app 2>&1 | tail -10 | grep -q 'MongoDB Connected'; then
  echo "OK: app resolves mongo and database is connected."
else
  echo "WARN: verify mongo connectivity: docker logs sexappeal_app --tail 20"
fi
