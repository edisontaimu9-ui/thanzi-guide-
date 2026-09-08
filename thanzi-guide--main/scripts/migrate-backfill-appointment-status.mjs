// One-time migration: sets status='booked' on every existing appointments
// document that predates the status attribute. Without this, an
// appointment booked before this migration reads back with status missing
// rather than 'booked' — anything that later filters or branches on status
// (provider inbox actions, Phase 2's notification function) would silently
// mistreat old appointments as being in no state at all.
//
// Safe to re-run — skips documents that already have a status set.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/migrate-backfill-appointment-status.mjs
// Run this AFTER scripts/apply-appointment-status-schema.sh has added the
// status attribute.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'appointments';

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error('Set APPWRITE_API_KEY before running this script.');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': apiKey
};

async function listPage(cursor) {
  const params = new URLSearchParams();
  params.append('queries[]', JSON.stringify({ method: 'limit', values: [100] }));
  if (cursor) params.append('queries[]', JSON.stringify({ method: 'cursorAfter', values: [cursor] }));

  const res = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?${params}`, {
    headers
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`List failed: ${JSON.stringify(body)}`);
  return body;
}

async function setBooked(id) {
  const res = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ data: { status: 'booked', statusUpdatedAt: new Date().toISOString() } })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Update failed for ${id}: ${JSON.stringify(body)}`);
}

let cursor;
let totalUpdated = 0;
let totalSeen = 0;

for (;;) {
  const page = await listPage(cursor);
  if (page.documents.length === 0) break;

  for (const doc of page.documents) {
    totalSeen++;
    if (doc.status) continue; // already set, skip
    await setBooked(doc.$id);
    totalUpdated++;
  }

  cursor = page.documents[page.documents.length - 1].$id;
  if (page.documents.length < 100) break;
}

console.log(`appointments: ${totalUpdated} updated, ${totalSeen - totalUpdated} already set, ${totalSeen} total.`);
console.log('Done.');
