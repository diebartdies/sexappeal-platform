#!/usr/bin/env bash
# Apply Twilio WhatsApp content template for cold outreach (Meta-approved).
# Run on prod: bash scripts/set-twilio-whatsapp-template.sh /root/SexAppeal-platform [CONTENT_SID]
set -euo pipefail

ROOT="${1:-/root/SexAppeal-platform}"
CONTENT_SID="${2:-${TWILIO_WHATSAPP_CONTENT_SID:-}}"
ENV_FILE="$ROOT/.env"

cd "$ROOT"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

if [[ -z "$CONTENT_SID" ]] && [[ -f "$ENV_FILE" ]]; then
  CONTENT_SID="$(grep -E '^TWILIO_WHATSAPP_CONTENT_SID=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '\r"' | xargs || true)"
fi

if [[ -z "$CONTENT_SID" ]]; then
  echo "Missing Content SID. Pass as 2nd argument or set TWILIO_WHATSAPP_CONTENT_SID in $ENV_FILE"
  echo "Example: bash scripts/set-twilio-whatsapp-template.sh $ROOT HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
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
echo "Register URL is static in template body (not a variable). Re-approve watext in Twilio if body changed."
echo ""
echo "Template HEADER (image) — SelfAppeal logo for cold outreach:"
echo "  Upload twilio/media or WhatsApp image header in Content Editor → watext"
echo "  Media URL (must be public HTTPS):"
docker exec sexappeal_app node -e "console.log(require('./utils/professionalInviteMessage').getOutreachBrandImageUrl())"
echo "  Regenerate PNG: node scripts/generate-outreach-logo.js"
echo ""
echo "Template BODY must match utils/professionalInviteMessage.js (buildColdOutreachStep1Message)."
echo "If you changed the text below, submit a new watext version in Twilio Console → Content."
echo "---"
docker exec sexappeal_app node -e "
const tw = require('./services/twilioWhatsAppService');
const { getColdOutreachTemplateBodySample } = require('./utils/professionalInviteMessage');
const cfg = require('./config/appConfig');
const vars = tw.buildContentVariables({ alias: tw.WATEXT_TEMPLATE_EXAMPLES['1'] });
console.log(getColdOutreachTemplateBodySample());
console.log('---');
console.log('TWILIO_WHATSAPP_CONTENT_SID:', cfg.sms.whatsappContentSid || '(missing)');
console.log('ContentVariables sample:', vars);
console.log('Twilio API mode:', tw.isApiModeEnabled());
console.log('Cold outreach block:', tw.getColdOutreachBlockReason() || '(none — ready to send)');
"
