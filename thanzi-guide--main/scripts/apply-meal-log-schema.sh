#!/data/data/com.termux/files/usr/bin/bash
# Creates the meal_logs collection (personal food diary — ported from the
# MoyoCare prototype's meal logging feature, rebuilt on Appwrite instead of
# Firebase). Applies directly via curl, bypassing the Appwrite CLI — see
# apply-messaging-schema.sh for why.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/apply-meal-log-schema.sh

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

echo "Creating meal_logs collection..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"collectionId":"meal_logs","name":"Meal Logs","documentSecurity":true,"enabled":true,"permissions":["create(\"users\")"]}'
echo

sleep 2

echo "Adding userId attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"userId","size":36,"required":true}'
echo

echo "Adding foodId attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"foodId","size":36,"required":true}'
echo

echo "Adding foodName attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"foodName","size":200,"required":true}'
echo

echo "Adding mealType attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"mealType","size":20,"required":true}'
echo

echo "Adding kcal attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/float" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"kcal","required":false}'
echo

echo "Adding proteinG attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/float" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"proteinG","required":false}'
echo

echo "Adding carbsG attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/float" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"carbsG","required":false}'
echo

echo "Adding fatG attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/float" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"fatG","required":false}'
echo

echo "Adding loggedAt attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/attributes/datetime" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"loggedAt","required":true}'
echo

echo "Waiting for attributes to finish provisioning..."
sleep 8

echo "Creating user_idx index..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/meal_logs/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"user_idx","type":"key","attributes":["userId","loggedAt"],"orders":["ASC","DESC"]}'
echo

echo "Done. Check the output above for any \"error\" or \"message\" fields indicating a problem."
