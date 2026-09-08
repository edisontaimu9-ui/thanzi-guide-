#!/data/data/com.termux/files/usr/bin/bash
# Enables document security on appointment_slots and allows signed-in users
# to create slots (app-side logic restricts this to linked providers
# creating slots under their own providerId). Each provider grants
# themselves update/delete permission on their own slot at creation time —
# this works from a regular client session because self-granting your own
# permissions is always allowed, unlike granting to another user's ID.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/enable-provider-slot-management.sh

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"

curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/appointment_slots" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Appointment Slots","documentSecurity":true,"enabled":true,"permissions":["read(\"any\")","create(\"label:admin\")","create(\"users\")","update(\"label:admin\")","delete(\"label:admin\")"]}'
echo
echo "Done. Check the output above for an \"error\" field indicating a problem."
