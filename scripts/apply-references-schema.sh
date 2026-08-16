#!/data/data/com.termux/files/usr/bin/bash
# Creates the reference_files bucket and user_references / reference_chunks
# collections for the "Further Reading & References" upload feature.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/apply-references-schema.sh

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

echo "Creating reference_files bucket..."
curl -s -X POST "$ENDPOINT/storage/buckets" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"bucketId":"reference_files","name":"Reference Files","fileSecurity":true,"enabled":true,"maximumFileSize":15000000,"allowedFileExtensions":["pdf","docx","txt","csv","jpg","jpeg","png","webp"],"permissions":["create(\"users\")"]}'
echo
sleep 1

echo "Creating user_references collection..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"collectionId":"user_references","name":"User References","documentSecurity":true,"enabled":true,"permissions":["create(\"users\")"]}'
echo
sleep 1

for attr in \
  '{"key":"userId","size":36,"required":true}' \
  '{"key":"fileName","size":300,"required":true}' \
  '{"key":"fileType","size":20,"required":true}' \
  '{"key":"storageFileId","size":36,"required":true}' \
  '{"key":"status","size":20,"required":false,"default":"processing"}' \
  '{"key":"errorMessage","size":500,"required":false}'
do
  echo "Adding user_references attribute..."
  curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/user_references/attributes/string" \
    -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" -d "$attr"
  echo
done

echo "Adding chunkCount attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/user_references/attributes/integer" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"chunkCount","required":false,"default":0}'
echo
sleep 2

echo "Adding userId_idx index to user_references..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/user_references/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"userId_idx","type":"key","attributes":["userId"]}'
echo
sleep 1

echo "Creating reference_chunks collection..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"collectionId":"reference_chunks","name":"Reference Chunks","documentSecurity":true,"enabled":true,"permissions":["create(\"users\")"]}'
echo
sleep 1

for attr in \
  '{"key":"referenceId","size":36,"required":true}' \
  '{"key":"userId","size":36,"required":true}' \
  '{"key":"sectionLabel","size":100,"required":false}' \
  '{"key":"text","size":3000,"required":true}'
do
  echo "Adding reference_chunks string attribute..."
  curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/reference_chunks/attributes/string" \
    -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" -d "$attr"
  echo
done

echo "Adding chunkIndex attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/reference_chunks/attributes/integer" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"chunkIndex","required":true}'
echo

echo "Adding pageNumber attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/reference_chunks/attributes/integer" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"pageNumber","required":false}'
echo
sleep 2

echo "Adding indexes to reference_chunks..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/reference_chunks/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"referenceId_idx","type":"key","attributes":["referenceId"]}'
echo
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/reference_chunks/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"userId_idx","type":"key","attributes":["userId"]}'
echo

echo "Done. Check the output above for any \"error\" field indicating a problem."
