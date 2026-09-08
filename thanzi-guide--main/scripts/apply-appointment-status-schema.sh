#!/data/data/com.termux/files/usr/bin/bash
# Adds status/statusUpdatedAt/cancelledBy to the appointments collection, so
# the appointment lifecycle (booked/confirmed/rejected/rescheduled/cancelled)
# can actually be represented — today "exists = booked", "deleted =
# cancelled" is the entire state machine, which is why provider
# accept/reject/reschedule has nowhere to write its outcome.
#
# Applies directly via curl, bypassing the Appwrite CLI — see
# apply-messaging-schema.sh for why.
#
# Usage: APPWRITE_API_KEY=your_key bash scripts/apply-appointment-status-schema.sh
# Run scripts/migrate-backfill-appointment-status.mjs AFTER this finishes, so
# existing appointment docs (which predate this attribute) get an explicit
# status instead of reading as blank.

set -e

if [ -z "$APPWRITE_API_KEY" ]; then
  echo "Set APPWRITE_API_KEY before running this script."
  exit 1
fi

ENDPOINT="https://fra.cloud.appwrite.io/v1"
PROJECT_ID="6a7967cf000f28e73c22"
DATABASE_ID="thanzi_guide"
COLLECTION_ID="appointments"

H_PROJECT="X-Appwrite-Project: $PROJECT_ID"
H_KEY="X-Appwrite-Key: $APPWRITE_API_KEY"
H_JSON="Content-Type: application/json"

echo "Adding status attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$COLLECTION_ID/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"status","size":20,"required":false,"default":"booked"}'
echo

# NOTE: Appwrite only applies a new attribute's default to documents created
# AFTER the attribute exists — existing rows read back with status missing,
# not "booked". That's exactly the gap migrate-backfill-appointment-status.mjs
# fills; see migrate-backfill-status.mjs for the same pattern used elsewhere
# in this project.

echo "Adding statusUpdatedAt attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$COLLECTION_ID/attributes/datetime" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"statusUpdatedAt","required":false}'
echo

# Stores the userId of whoever last changed status (patient cancelling vs.
# provider accepting/rejecting/cancelling) — not a role string like
# "patient"/"provider", so it stays a verifiable audit trail: cross-reference
# against appointments.userId or providers.userId rather than trusting a
# caller-supplied label.
echo "Adding cancelledBy attribute..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$COLLECTION_ID/attributes/string" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"cancelledBy","size":36,"required":false}'
echo

echo "Waiting for attributes to finish provisioning..."
sleep 8

echo "Creating status_idx index..."
curl -s -X POST "$ENDPOINT/databases/$DATABASE_ID/collections/$COLLECTION_ID/indexes" \
  -H "$H_PROJECT" -H "$H_KEY" -H "$H_JSON" \
  -d '{"key":"status_idx","type":"key","attributes":["status"]}'
echo

echo "Done. Check the output above for any \"error\" or \"message\" fields indicating a problem."
echo "Next: APPWRITE_API_KEY=your_key node scripts/migrate-backfill-appointment-status.mjs"
