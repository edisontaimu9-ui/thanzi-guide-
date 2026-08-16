#!/data/data/com.termux/files/usr/bin/bash
# Locks down the per-user self-upload path ("Further Reading &
# References" on the Ask page) so regular users can no longer create
# files/documents there. Only profile picture uploads (avatars bucket,
# unchanged) remain open to regular users; everything else admin-only.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/lock-down-user-reference-uploads.sh

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

echo "Creating reference_files bucket (admin-only — the personal self-upload"
echo "feature that originally needed 'users' access has been removed, so this"
echo "bucket now exists purely to back admin-uploaded CMS reference documents)..."
curl -s -X POST "$ENDPOINT/storage/buckets" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"bucketId":"reference_files","name":"Reference Files","fileSecurity":true,"enabled":true,"maximumFileSize":15000000,"allowedFileExtensions":["pdf","docx","txt","csv","jpg","jpeg","png","webp"],"permissions":["create(\"label:admin\")"]}'
echo
sleep 1

echo "Locking down user_references collection (create: label:admin only)..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/user_references" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"User References","permissions":["create(\"label:admin\")"],"documentSecurity":true,"enabled":true}'
echo
sleep 1

echo "Locking down reference_chunks collection (create: label:admin only)..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/reference_chunks" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"Reference Chunks","permissions":["create(\"label:admin\")"],"documentSecurity":true,"enabled":true}'
echo

echo "Done. Check the output above for any \"error\" field indicating a problem."
echo "avatars bucket was left untouched — profile picture uploads still work for all users."
