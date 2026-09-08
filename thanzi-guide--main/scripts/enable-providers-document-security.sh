#!/data/data/com.termux/files/usr/bin/bash
# Enables document-level security on the providers collection. Required
# before a specific provider can be granted update permission on just
# their own document (link-and-empower-provider.sh) — without this,
# Appwrite ignores document-level permissions entirely and only the
# collection-level ones (label:admin) apply.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/enable-providers-document-security.sh

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"

curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/providers" \
  -H "X-Appwrite-Project: $PROJECT_ID" \
  -H "X-Appwrite-Key: $APPWRITE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Providers","documentSecurity":true,"enabled":true,"permissions":["read(\"any\")","create(\"label:admin\")","update(\"label:admin\")","delete(\"label:admin\")"]}'
echo
echo "Done. Check the output above for an \"error\" field indicating a problem."
