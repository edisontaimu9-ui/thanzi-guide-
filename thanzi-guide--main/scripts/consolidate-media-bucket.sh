#!/data/data/com.termux/files/usr/bin/bash
# This Appwrite plan allows exactly one storage bucket. "food_images" is
# the only bucket that actually exists on the project (avatars,
# article_images, and reference_files were declared in code/appwrite.json
# but never successfully created). This script reconfigures food_images
# into a shared bucket for everything: food/article images (external URLs
# mostly, no upload UI for those), provider avatars, and admin-uploaded
# reference documents — separated by allowed extensions and by which
# role is permitted to create files, not by separate buckets.
#
# Safe to re-run.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/consolidate-media-bucket.sh

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
H_PROJECT="X-Appwrite-Project: $PROJECT_ID"
H_KEY="X-Appwrite-Key: $APPWRITE_API_KEY"
H_JSON="Content-Type: application/json"

echo "Reconfiguring food_images into a shared media bucket..."
curl -s -X PUT "$ENDPOINT/storage/buckets/food_images" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{
    "name": "Media",
    "fileSecurity": false,
    "enabled": true,
    "maximumFileSize": 15000000,
    "allowedFileExtensions": ["jpg","jpeg","png","webp","pdf","docx","txt","csv"],
    "permissions": [
      "read(\"any\")",
      "create(\"label:editor\")",
      "create(\"users\")",
      "create(\"label:admin\")",
      "update(\"label:admin\")",
      "delete(\"label:admin\")"
    ]
  }'
echo
echo "Done. Check the output above for any \"error\" field indicating a problem."
echo "food_images now backs: provider avatar uploads (any logged-in user,"
echo "their own photo only via app logic), and admin reference document"
echo "uploads via the Content Manager (label:admin only)."
