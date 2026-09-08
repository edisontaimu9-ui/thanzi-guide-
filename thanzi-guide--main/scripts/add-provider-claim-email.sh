#!/data/data/com.termux/files/usr/bin/bash
# Adds the claimEmail attribute to providers, so the Claim Provider Profile
# function has something to match a signing-up provider's account email
# against.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/add-provider-claim-email.sh

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"

echo "Adding claimEmail attribute to providers..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/providers/attributes/string" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key":"claimEmail","size":320,"required":false}'
echo

sleep 2

echo "Creating claimEmail_idx index..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/providers/indexes" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"key":"claimEmail_idx","type":"key","attributes":["claimEmail"]}'
echo

echo "Done. Check the output above for any \"error\" field indicating a problem."
