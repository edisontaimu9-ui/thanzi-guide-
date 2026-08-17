#!/data/data/com.termux/files/usr/bin/bash
# Adds a "category" attribute to the references collection, powering the
# library-shelf redesign of the public References page (Books, Clinical
# Nutrition Guidelines, Research Articles, Academic Materials, Malawi
# Nutrition Resources, Global Nutrition, Food & Nutrition Data, Clinical
# Tools — see src/lib/referenceCategories.ts for the canonical list).
# Existing reference documents will simply have no category until an
# admin sets one from the Content Manager; the library UI folds those
# into an "Uncategorized" shelf rather than hiding them.
#
# Safe to re-run.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/add-references-category-attribute.sh

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

echo "Adding category attribute to references collection..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/references/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"category","size":64,"required":false}'
echo
echo "Done. Check the output above for an \"error\" field. It may take a"
echo "few seconds for the attribute to move from status:processing to"
echo "status:available — retry saving a reference in the Content Manager"
echo "after a moment if the category dropdown doesn't save yet."
