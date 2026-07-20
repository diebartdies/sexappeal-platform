#!/bin/bash
# selfappeal.drsrv.net.ar has been retired (was used for cold outreach only).
# This script now just removes any leftover alias vhost so nginx no longer serves it.
set -eu

DEPLOY_DIR="${1:-/root/SexAppeal-platform}"
CONF_D="$DEPLOY_DIR/nginx/conf.d"
SELFAPPEAL_SSL="$CONF_D/selfappeal.ssl.conf"

if [ -f "$SELFAPPEAL_SSL" ]; then
  rm -f "$SELFAPPEAL_SSL"
  echo "OK: removed retired vhost $SELFAPPEAL_SSL"
else
  echo "INFO: no selfappeal vhost present (already retired)."
fi
