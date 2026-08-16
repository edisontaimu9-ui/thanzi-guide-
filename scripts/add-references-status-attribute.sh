#!/data/data/com.termux/files/usr/bin/bash
# Fixes "Invalid document structure: Unknown attribute: status" when
# saving a Reference in the Content Manager. The references collection
# was created (back in commit bd2786e) without a status attribute, even
# though the generic Content Manager form always tries to save
# status: "draft" on create. This has been broken since references was
# first added — nobody had tried saving one until the file-upload work
# surfaced it.
#
# Safe to re-run.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/add-references-status-attribute.sh

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

echo "Adding status attribute to references collection..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/references/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"status","size":16,"required":false,"default":"draft"}'
echo
echo "Done. Check the output above for an \"error\" field. It may take a"
echo "few seconds for the attribute to move from status:processing to"
echo "status:available — retry saving a reference in the Content Manager"
echo "after a moment if it still fails immediately."
