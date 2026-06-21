#!/usr/bin/env bash
# Apply Twilio WhatsApp content template for cold outreach (Meta-approved).
# Template: watext  |  SID: HX92a57f64dfa083cb94b884da55a85cde  |  Spanish (ARG)  |  Approved 2026-06-21
# Run on prod: bash scripts/set-twilio-whatsapp-template.sh /root/SexAppeal-platform
set -euo pipefail

ROOT="${1:-/root/SexAppeal-platform}"
CONTENT_SID="${2:-HX92a57f64dfa083cb94b884da55a85cde}"
ENV_FILE="$ROOT/.env"

cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

sed -i 's/\r$//' "$ENV_FILE"

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    echo "Updated ${key}"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    echo "Added ${key}"
  fi
}

set_env TWILIO_WHATSAPP_CONTENT_SID "$CONTENT_SID"

# Prefer official Twilio API + approved template over QR webjs mode.
if grep -q '^WHATSAPP_USE_WEBJS=' "$ENV_FILE"; then
  sed -i 's/^WHATSAPP_USE_WEBJS=.*/WHATSAPP_USE_WEBJS=false/' "$ENV_FILE"
  echo "Set WHATSAPP_USE_WEBJS=false (Twilio template mode)"
fi

docker compose up -d --force-recreate app

echo ""
echo "=== Template watext (${CONTENT_SID}) configured ==="
echo "Step 1 cold outreach — one variable in ContentVariables JSON:"
echo '  {"1":"<alias>"}'
echo "Example for Meta / tests:"
echo "  {{1}} = María  (env: TWILIO_WA_TEMPLATE_EXAMPLE_1)"
echo "Register link goes in step 2 (manual reply), not in the template."
echo ""
docker exec sexappeal_app node -e "
const tw = require('./services/twilioWhatsAppService');
const cfg = require('./config/appConfig');
const vars = tw.buildContentVariables({ alias: tw.WATEXT_TEMPLATE_EXAMPLES['1'] });
console.log('TWILIO_WHATSAPP_CONTENT_SID:', cfg.sms.whatsappContentSid || '(missing)');
console.log('ContentVariables sample:', vars);
console.log('Twilio API mode:', tw.isApiModeEnabled());
console.log('Cold outreach block:', tw.getColdOutreachBlockReason() || '(none — ready to send)');
"
