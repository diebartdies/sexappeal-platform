#!/bin/bash
# Verify upload_package.tar.gz checksum and extract (called from upload_to_server.bat)
set -eu

EXPECTED="${1:-}"
DEPLOY_DIR="${2:-/root/SexAppeal-platform}"

norm_hash() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]'
}

cd "$DEPLOY_DIR"

if [ ! -f upload_package.tar.gz ]; then
  echo "ERROR: upload_package.tar.gz not found in $DEPLOY_DIR"
  exit 1
fi

if [ -z "$EXPECTED" ]; then
  echo "ERROR: missing expected checksum argument"
  exit 1
fi

REMOTE=$(sha256sum upload_package.tar.gz | awk '{print $1}')
REMOTE=$(norm_hash "$REMOTE")
EXPECTED=$(norm_hash "$EXPECTED")

echo "Server checksum:  $REMOTE"
echo "Expected checksum: $EXPECTED"

if [ "$REMOTE" != "$EXPECTED" ]; then
  echo "CHECKSUM MISMATCH - deployment aborted."
  rm -f upload_package.tar.gz
  exit 1
fi

echo "Checksums match. Extracting..."
tar -xzf upload_package.tar.gz
rm -f upload_package.tar.gz
echo "Files extracted successfully."
