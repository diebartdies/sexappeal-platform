#!/bin/bash
# Writes nginx/conf.d/selfappeal.ssl.conf when alias TLS material exists on the host.
set -eu

DEPLOY_DIR="${1:-/root/SexAppeal-platform}"
CONF_D="$DEPLOY_DIR/nginx/conf.d"
SELFAPPEAL_SSL="$CONF_D/selfappeal.ssl.conf"
SELFAPPEAL_DIR="$DEPLOY_DIR/certbot/conf/live/selfappeal.drsrv.net.ar"
FCWA_DIR="$DEPLOY_DIR/certbot/conf/live/fcwa.drsrv.net.ar"

mkdir -p "$CONF_D"
rm -f "$SELFAPPEAL_SSL"

if [ ! -f "$SELFAPPEAL_DIR/fullchain.pem" ] && [ -f "$FCWA_DIR/fullchain.pem" ]; then
  echo "WARN: selfappeal cert missing — copying fcwa cert as temporary alias TLS (run sync-ssl-certs-selfappeal on Windows)..."
  mkdir -p "$SELFAPPEAL_DIR"
  cp -f "$FCWA_DIR/fullchain.pem" "$SELFAPPEAL_DIR/fullchain.pem"
  cp -f "$FCWA_DIR/privkey.pem" "$SELFAPPEAL_DIR/privkey.pem"
fi

if [ ! -f "$SELFAPPEAL_DIR/fullchain.pem" ] || [ ! -f "$SELFAPPEAL_DIR/privkey.pem" ]; then
  echo "INFO: No alias TLS cert — selfappeal HTTPS vhost omitted (HTTP :80 still serves ACME)."
  exit 0
fi

cat > "$SELFAPPEAL_SSL" <<'EOF'
# Auto-generated — selfappeal.drsrv.net.ar (alias outreach domain)
server {
    listen 443 ssl;
    server_name selfappeal.drsrv.net.ar;

    ssl_certificate /etc/nginx/certs-live/selfappeal.drsrv.net.ar/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs-live/selfappeal.drsrv.net.ar/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://app:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "OK: wrote $SELFAPPEAL_SSL"
