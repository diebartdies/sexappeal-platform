#!/bin/bash

# EasyDNS Dynamic DNS Update Script
# Loads credentials from .env file

# Get the directory of the script to reliably find .env even when run via cron
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "$SCRIPT_DIR/.env" ]; then
    # Load ONLY the EASYDNS_ variables to prevent errors with spaces in other .env variables
    set -a
    source <(grep -E '^EASYDNS_' "$SCRIPT_DIR/.env" | sed -e 's/\r//g')
    set +a
else
    echo "Error: .env file not found in $SCRIPT_DIR"
    exit 1
fi

# Check if required variables are set
if [ -z "$EASYDNS_USERNAME" ] || [ -z "$EASYDNS_TOKEN" ] || [ -z "$EASYDNS_HOSTNAME" ]; then
    echo "Error: EASYDNS_USERNAME, EASYDNS_TOKEN, or EASYDNS_HOSTNAME is missing from .env"
    exit 1
fi

# The easyDNS endpoint for DDNS updates.
# By omitting the 'myip' parameter, easyDNS will automatically detect 
# and use the public IP address the request originates from.
API_URL="https://api.cp.easydns.com/dyn/generic.php?hostname=${EASYDNS_HOSTNAME}"

echo "[$(date)] Updating EasyDNS for ${EASYDNS_HOSTNAME}..."

RESPONSE=$(curl -s -u "${EASYDNS_USERNAME}:${EASYDNS_TOKEN}" "${API_URL}")

echo "EasyDNS Response:"
echo "${RESPONSE}"
