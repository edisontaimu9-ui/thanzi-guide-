#!/data/data/com.termux/files/usr/bin/bash
# Adds a dedupeKey attribute + unique index to the notifications collection.
# This is what makes functions/appointment-notifications idempotent: every
# notification it creates carries a dedupeKey like
# "<appointmentId>:confirmed:patient", and the unique index rejects a
# second insert with the same key (Appwrite retrying the event, or two
# triggers racing on the same status change) instead of creating a
# duplicate notification.
#
# Applies directly via curl, bypassing the Appwrite CLI — see
# apply-messaging-schema.sh for why.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/apply-notification-dedupe-schema.sh

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"
COLLECTION_ID="notifications"

H_PROJECT="X-Appwrite-Project: $PROJECT_ID"
H_KEY="X-Appwrite-Key: $APPWRITE_API_KEY"
H_JSON="Content-Type: application/json"

echo "Adding dedupeKey attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$COLLECTION_ID/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"dedupeKey","size":100,"required":false}'
echo

echo "Waiting for attribute to finish provisioning..."
sleep 8

# Unique, not just a key index — this is the actual dedup enforcement.
# Existing notification docs (pre-dedupeKey) all have dedupeKey unset/null;
# Appwrite's unique index does not collide multiple nulls, so this is safe
# to add without a backfill.
echo "Creating dedupeKey_unique index..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$COLLECTION_ID/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"dedupeKey_unique","type":"unique","attributes":["dedupeKey"]}'
echo

echo "Done. Check the output above for any \"error\" or \"message\" fields indicating a problem."
