#!/data/data/com.termux/files/usr/bin/bash
# Two permission fixes:
# 1. lessons/quizzes/questions/answers currently require label:nutritionExpert
#    to create/update — changed to label:editor so they're consistent with
#    every other Content Manager type.
# 2. partner_inquiries currently has no update/delete permission at all
#    (only create + admin read) — adding label:admin update/delete so the
#    new Partner Inquiries viewer can let you clear out old entries.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/align-content-permissions.sh

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

echo "Updating lessons permissions..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/lessons" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"Lessons","documentSecurity":false,"enabled":true,"permissions":["read(\"any\")","create(\"label:editor\")","update(\"label:editor\")","delete(\"label:admin\")"]}'
echo

echo "Updating quizzes permissions..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/quizzes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"Quizzes","documentSecurity":false,"enabled":true,"permissions":["read(\"any\")","create(\"label:editor\")","update(\"label:editor\")","delete(\"label:admin\")"]}'
echo

echo "Updating questions permissions..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/questions" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"Questions","documentSecurity":false,"enabled":true,"permissions":["read(\"any\")","create(\"label:editor\")","update(\"label:editor\")","delete(\"label:admin\")"]}'
echo

echo "Updating answers permissions..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/answers" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"Answers","documentSecurity":false,"enabled":true,"permissions":["read(\"any\")","create(\"label:editor\")","update(\"label:editor\")","delete(\"label:admin\")"]}'
echo

echo "Updating partner_inquiries permissions..."
curl -s -X PUT "$ENDPOINT/databases/$DATABASE_ID/collections/partner_inquiries" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"name":"Partner Inquiries","documentSecurity":false,"enabled":true,"permissions":["create(\"any\")","read(\"label:admin\")","update(\"label:admin\")","delete(\"label:admin\")"]}'
echo

echo "Done. Check the output above for any \"error\" field indicating a problem."
