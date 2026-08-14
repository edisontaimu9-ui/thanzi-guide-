#!/data/data/com.termux/files/usr/bin/bash
# Adds read("users") at the collection level to `messages`. This is needed
# because a regular client session can only grant document permissions to
# ITSELF, not to some other specific user's ID — so per-message
# patient+provider permissions never worked from the browser. Collection-
# level read solves it (same pattern the `appointments` collection already
# uses). Write/delete stays scoped to the sender via document permissions
# set at creation time in src/lib/messages.ts.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/fix-messages-read-permission.sh

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"

curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/messages" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Messages","documentSecurity":true,"enabled":true,"permissions":["create(\"users\")","read(\"users\")"]}'
echo
echo "Done. Check the output above for an \"error\" field indicating a problem."
