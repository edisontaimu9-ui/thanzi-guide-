#!/data/data/com.termux/files/usr/bin/bash
# Links a provider's document to their login (userId) AND grants that
# account update permission on their own provider document, so going
# forward they can edit their own profile (bio, photo, contact info)
# straight from the Content Manager, without needing an admin to do it.
#
# You only need to run this once per provider. The auto-verification of
# "is this really them" still happens on your end (you're the one running
# this script with the right IDs) — Appwrite doesn't allow a regular login
# session to safely self-link, only a request with the API key can.
#
# Usage:
#   APPWRITE_API_KEY=your_key bash scripts/link-and-empower-provider.sh <provider-doc-id> <user-id>
#
# Example:
#   APPWRITE_API_KEY=xxxx bash scripts/link-and-empower-provider.sh 6a7abfb377794b9832fa 6a796f09003ddc92a4e2

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

PROVIDER_DOC_ID="$1"
USER_ID="$2"

if [ -z "$PROVIDER_DOC_ID" ] || [ -z "$USER_ID" ]; then
  echo "Usage: bash scripts/link-and-empower-provider.sh <provider-doc-id> <user-id>"
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"

curl -s -X PATCH "$ENDPOINT/databases/$DATABASE_ID/collections/providers/documents/$PROVIDER_DOC_ID" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"data\":{\"userId\":\"$USER_ID\"},\"permissions\":[\"update(\\\"user:$USER_ID\\\")\",\"read(\\\"user:$USER_ID\\\")\"]}"
echo
echo "Done. This provider can now edit their own profile (once they're also given an editor label, or once we add a self-edit path outside Content Manager)."
