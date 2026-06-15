#!/bin/bash

echo "==================================================="
echo "🚨 BULLETPROOF REBUILD & RESET SCRIPT 🚨"
echo "==================================================="

echo "[0/8] Navigating to the correct project directory (/root/SexAppeal-platform)..."
cd /root/SexAppeal-platform || { echo "Project directory not found! Exiting."; exit 1; }

echo "[0b/8] Disk housekeeping (aggressive — before full rebuild)..."
if [ -f scripts/disk-housekeeping.sh ]; then
    AGGRESSIVE=1 bash scripts/disk-housekeeping.sh "$(pwd)" || { echo "ERROR: Not enough disk space for rebuild."; exit 1; }
else
    echo "WARN: scripts/disk-housekeeping.sh missing — running basic prune..."
    docker builder prune -af 2>/dev/null || true
    docker system prune -f 2>/dev/null || true
fi

# 1. Ensure lsof is installed
echo "[1/8] Checking for lsof utility..."
if ! command -v lsof &> /dev/null; then
    echo "lsof not found. Installing..."
    apt-get update && apt-get install -y lsof
fi

echo "[2/8] Stopping existing Docker containers and wiping data volumes..."
docker-compose down -v

echo "[3/8] Force-killing ghost processes on ports 80, 443, and 27017..."
# Suppress errors if nothing is currently listening on these ports
kill -9 $(lsof -t -i:80) 2>/dev/null || true
kill -9 $(lsof -t -i:443) 2>/dev/null || true
kill -9 $(lsof -t -i:27017) 2>/dev/null || true

# Stop default Linux host services that might be stealing our ports
systemctl stop apache2 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
systemctl stop mongod 2>/dev/null || true

echo "[4/8] Restarting Docker daemon to flush corrupted networks..."
systemctl restart docker
sleep 3

echo "[5/8] Cleaning up dangling Docker resources..."
docker container prune -f 2>/dev/null || true
docker image prune -f 2>/dev/null || true

echo "[6/8] Rebuilding Docker images from scratch (no cache)..."
docker-compose build --no-cache

echo "[7/8] Starting the pristine stack..."
docker-compose up -d

echo "[8/8] Waiting for MongoDB and Node.js to fully boot (15 seconds)..."
sleep 15

echo "==================================================="
echo "🌱 Seeding reference data (provinces/cities/neighborhoods — no users)..."
docker exec sexappeal_app node seed.js

echo "==================================================="
echo "🔄 Restoring latest daily backup..."
/root/SexAppeal-platform/restore_latest_daily_backup.sh || { echo "ERROR: Database restore failed! Check logs."; exit 1; }

echo "==================================================="
echo "✅ PLATFORM REBUILT AND ONLINE!"
echo "==================================================="