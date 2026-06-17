#!/usr/bin/env bash
#
# deploy_outreach.sh
# Deploy the WhatsApp outreach fix and prepare the bulk slow-drip on PROD (Moldova).
#
# WHAT IT DOES (in order):
#   1. Stops any standalone `npm run outreach` CLI (it conflicts with the app's Tulio session).
#   2. Counts the fake seed leads and (after you confirm) deletes them.
#   3. Rebuilds the app image so the outreach loop fix + invite-message copy are baked in.
#   4. Recreates the app container (Tulio's WhatsApp session survives via the named volume).
#   5. Verifies the container is up and Chromium launches.
#   6. Prints current lead counts and the final manual step (start the drip from the Admin panel).
#
# PREREQUISITE:
#   The updated source files must already be on THIS host, in particular:
#     - services/whatsappOutreachService.js   (loop/timeout fix; baked into image -> needs rebuild)
#     - utils/professionalInviteMessage.js    (new invite copy)
#   Sync them with your usual deploy/copy (or `git pull`) BEFORE running this script.
#
# USAGE:
#   Run from the repo root on the server (where docker-compose.yml lives):
#     bash deploy_outreach.sh
#
set -euo pipefail

APP=sexappeal_app
MONGO=sexappeal_mongo
DB=sexappeal

echo "==> 1) Stopping any standalone outreach CLI (conflicts with the app session)..."
docker exec "$APP" sh -c "pkill -f whatsapp_outreach || true" 2>/dev/null || true

echo
echo "==> 2) Counting fake seed leads (example-escorts-directory.com / 4444-55xx)..."
docker exec "$MONGO" mongo "$DB" --quiet --eval \
  'print("fake leads matched: " + db.potential_professionals.count({ $or: [ { sourceUrl: /example-escorts-directory\.com/ }, { phone: /4444-?55/ } ] }))'

echo
echo "    Listing them (phone / sourceUrl / status):"
docker exec "$MONGO" mongo "$DB" --quiet --eval \
  'db.potential_professionals.find({ $or: [ { sourceUrl: /example-escorts-directory\.com/ }, { phone: /4444-?55/ } ] }, { phone:1, sourceUrl:1, status:1, _id:0 }).forEach(printjson)'

echo
read -r -p "    Delete these fake leads now? [y/N] " ANS
if [ "${ANS:-N}" = "y" ] || [ "${ANS:-N}" = "Y" ]; then
  docker exec "$MONGO" mongo "$DB" --quiet --eval \
    'printjson(db.potential_professionals.deleteMany({ $or: [ { sourceUrl: /example-escorts-directory\.com/ }, { phone: /4444-?55/ } ] }))'
  echo "    Fake leads deleted."
else
  echo "    Skipped deletion (you can re-run later)."
fi

echo
echo "==> 3) Rebuilding app image (bakes outreach fix + invite message)..."
docker compose build app

echo
echo "==> 4) Recreating app container (Tulio session persists via volume)..."
docker compose up -d app

echo
echo "==> 5) Verifying container + Chromium..."
docker ps --format 'table {{.Names}}\t{{.Status}}'
docker exec "$APP" sh -c "chromium-browser --version 2>/dev/null || chromium --version"

echo
echo "==> 6) Current lead counts:"
docker exec "$MONGO" mongo "$DB" --quiet --eval \
  'printjson({pending: db.potential_professionals.count({status:"pending"}), contacted: db.potential_professionals.count({status:"contacted"}), rejected: db.potential_professionals.count({status:"rejected"})})'

cat <<'NEXT'

============================================================
 DEPLOY DONE. Now START the bulk drip from the Admin panel:
   Admin -> Communications -> Apply Invitations -> "Apply to all pending"
 (This reuses Tulio's connected session. Do NOT run `npm run outreach`.)

 Monitor any time:
   docker exec sexappeal_mongo mongo sexappeal --quiet --eval \
     'printjson({pending: db.potential_professionals.count({status:"pending"}), contacted: db.potential_professionals.count({status:"contacted"}), rejected: db.potential_professionals.count({status:"rejected"})})'
============================================================
NEXT
