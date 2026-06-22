#!/usr/bin/env bash
# Apply Twilio WhatsApp content template for cold outreach (Meta-approved).
# Run on prod: bash scripts/set-twilio-whatsapp-template.sh /root/SexAppeal-platform [CONTENT_SID]
set -euo pipefail

ROOT="${1:-/root/SexAppeal-platform}"
# Active template (Meta approved): watext
APPROVED_CONTENT_SID="HX92a57f64dfa083cb94b884da55a85cde"
# Pending Meta approval — do NOT set in .env until approved:
# watext_updated HX3e76b50fc1f69871bfbc4404c7666482
DEFAULT_CONTENT_SID="${APPROVED_CONTENT_SID}"
CONTENT_SID="${2:-${TWILIO_WHATSAPP_CONTENT_SID:-$DEFAULT_CONTENT_SID}}"
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
  echo "Approved (use now):  $APPROVED_CONTENT_SID  (watext)"
  echo "Pending approval:    HX3e76b50fc1f69871bfbc4404c7666482  (watext_updated — wait for Meta)"
  exit 1
fi

if [[ "$CONTENT_SID" == "HX3e76b50fc1f69871bfbc4404c7666482" ]]; then
  echo "WARN: watext_updated is not Meta-approved yet — cold sends may fail (error 63016/63041)."
  echo "      Keep $APPROVED_CONTENT_SID until Twilio shows Approved."
  if [[ -t 0 ]]; then
    read -r -p "Continue anyway? [y/N] " confirm
    [[ "${confirm,,}" == "y" ]] || exit 1
  else
    echo "Non-interactive shell — use approved SID: bash $0 $ROOT $APPROVED_CONTENT_SID"
    exit 1
  fi
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
echo "=== WhatsApp template (${CONTENT_SID}) configured ==="
echo "Step 1 cold outreach — one variable in ContentVariables JSON:"
echo '  {"1":"<alias>"}'
echo "Example for Meta / tests:"
echo "  {{1}} = María  (env: TWILIO_WA_TEMPLATE_EXAMPLE_1)"
echo "Register URL is static in template body (not a variable). Re-approve watext_updated in Twilio if body changed."
echo ""
echo "Template HEADER (image) — SelfAppeal logo for cold outreach:"
echo "  Upload twilio/media or WhatsApp image header in Content Editor → watext_updated"
echo "  Media URL (must be public HTTPS):"
docker exec sexappeal_app node -e "console.log(require('./utils/professionalInviteMessage').getOutreachBrandImageUrl())"
echo "  Regenerate PNG: node scripts/generate-outreach-logo.js"
echo ""
echo "Template BODY must match utils/professionalInviteMessage.js (buildColdOutreachStep1Message)."
echo "If you changed the text below, submit a new watext_updated version in Twilio Console → Content."
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
