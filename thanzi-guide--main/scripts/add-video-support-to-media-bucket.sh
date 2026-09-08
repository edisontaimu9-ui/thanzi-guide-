#!/data/data/com.termux/files/usr/bin/bash
# Expands the shared food_images bucket to accept video files (mp4, mov,
# webm, m4v, avi, mkv) in addition to images and documents, and raises
# the per-file size cap so video actually fits. Needed for admin
# reference document uploads to support video, not just PDF/DOCX.
#
# Safe to re-run.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/add-video-support-to-media-bucket.sh

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

echo "Adding video support to food_images bucket (raising size cap to 100MB)..."
curl -s -X PUT "$ENDPOINT/storage/buckets/food_images" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{
    "name": "Media",
    "fileSecurity": false,
    "enabled": true,
    "maximumFileSize": 100000000,
    "allowedFileExtensions": ["jpg","jpeg","png","webp","pdf","docx","txt","csv","mp4","mov","webm","m4v","avi","mkv"],
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
echo "Done. Check the output above for an \"error\" field."
echo "Note: this Appwrite plan's TOTAL storage quota is separate from the"
echo "per-file size cap above — a handful of large videos can fill it"
echo "fast. If uploads start failing with a storage/quota error rather"
echo "than a file-size error, that's the plan's overall limit, not this"
echo "script."
