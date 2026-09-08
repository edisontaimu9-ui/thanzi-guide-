#!/data/data/com.termux/files/usr/bin/bash
# Creates the exercise_logs collection — sibling to meal_logs, backs the
# Exercise Log feature built on the ported activity-calories.js table.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/apply-exercise-log-schema.sh

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

echo "Creating exercise_logs collection..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"collectionId":"exercise_logs","name":"Exercise Logs","documentSecurity":true,"enabled":true,"permissions":["create(\"users\")"]}'
echo

sleep 2

echo "Adding userId attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/exercise_logs/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"userId","size":36,"required":true}'
echo

echo "Adding activityName attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/exercise_logs/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"activityName","size":100,"required":true}'
echo

echo "Adding durationMin attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/exercise_logs/attributes/integer" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"durationMin","required":true,"min":1,"max":1440}'
echo

echo "Adding kcalBurned attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/exercise_logs/attributes/integer" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"kcalBurned","required":true,"min":0,"max":10000}'
echo

echo "Adding loggedAt attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/exercise_logs/attributes/datetime" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"loggedAt","required":true}'
echo

echo "Waiting for attributes to finish provisioning..."
sleep 6

echo "Creating user_idx index..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/exercise_logs/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"user_idx","type":"key","attributes":["userId","loggedAt"],"orders":["ASC","DESC"]}'
echo

echo "Done. Check the output above for any \"error\" or \"message\" fields indicating a problem."
