#!/data/data/com.termux/files/usr/bin/bash
# Adds admin-uploaded, publicly-downloadable file attachments to the CMS
# "References" content type (Content Manager -> References). Only admins
# can upload (create/update the references collection and the
# reference_documents bucket are label:admin-only); everyone can read/
# download.
#
# This is separate from reference_files / user_references, which is the
# per-user personal "Further Reading" upload feature — do not confuse the
# two buckets.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/apply-reference-documents-upload-schema.sh

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

echo "Creating reference_documents bucket..."
curl -s -X POST "$ENDPOINT/storage/buckets" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"bucketId":"reference_documents","name":"Reference Documents","fileSecurity":false,"enabled":true,"maximumFileSize":20000000,"allowedFileExtensions":["pdf","docx","txt","csv","jpg","jpeg","png","webp"],"permissions":["read(\"any\")","create(\"label:admin\")","update(\"label:admin\")","delete(\"label:admin\")"]}'
echo
sleep 1

echo "Adding fileId attribute to references..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/references/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"fileId","size":36,"required":false}'
echo
sleep 1

echo "Adding fileName attribute to references..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/references/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"fileName","size":300,"required":false}'
echo
sleep 2

echo "Locking down references collection to admin-only create/update..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/references" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"References","permissions":["read(\"any\")","create(\"label:admin\")","update(\"label:admin\")","delete(\"label:admin\")"],"documentSecurity":false,"enabled":true}'
echo

echo "Done. Check the output above for any \"error\" field indicating a problem."
