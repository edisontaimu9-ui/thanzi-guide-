#!/data/data/com.termux/files/usr/bin/bash
# Applies the messaging schema (providers.userId + messages collection)
# directly via curl, bypassing the Appwrite CLI. Use this if
# `appwrite push collection` fails with "fetch failed" due to a broken
# IPv6 route — curl falls back to IPv4 automatically, Node's fetch doesn't.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/apply-messaging-schema.sh

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"

H_PROJECT="X-Appwrite-Project: $PROJECT_ID"
H_KEY="X-Appwrite-Key: $APPWRITE_API_KEY"
H_JSON="Content-Type: application/json"

echo "Adding userId attribute to providers..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/providers/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"userId","size":36,"required":false}'
echo

sleep 2

echo "Creating messages collection..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"collectionId":"messages","name":"Messages","documentSecurity":true,"enabled":true,"permissions":["create(\"users\")"]}'
echo

sleep 1

echo "Adding appointmentId attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/messages/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"appointmentId","size":36,"required":true}'
echo

echo "Adding senderId attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/messages/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"senderId","size":36,"required":true}'
echo

echo "Adding senderRole attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/messages/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"senderRole","size":20,"required":true}'
echo

echo "Adding body attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/messages/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"body","size":2000,"required":true}'
echo

echo "Waiting for attributes to finish provisioning..."
sleep 5

echo "Creating appointment_idx index..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/messages/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"appointment_idx","type":"key","attributes":["appointmentId"]}'
echo

echo "Done. Check the output above for any \"error\" or \"message\" fields indicating a problem."
