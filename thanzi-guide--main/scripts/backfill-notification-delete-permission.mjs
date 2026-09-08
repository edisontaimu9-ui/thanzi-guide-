// Backfills delete permission onto notification documents created before
// the "clear notifications" feature — those were only granted read/update
// for their owner, so a delete call from the app would be rejected.
//
// Written in Node (not curl) because it needs to list + loop over an
// unknown number of documents across pages, rather than a fixed one-shot
// payload like the other scripts/*.sh files.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/backfill-notification-delete-permission.mjs

const API_KEY = process.env.APPWRITE_API_KEY;
if (!API_KEY) {
  console.error('Set APPWRITE_API_KEY before running this script.');
  process.exit(1);
}

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'notifications';

const headers = {
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': API_KEY,
  'Content-Type': 'application/json'
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

async function patchPermissions(docId, permissions) {
  const res = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents/${docId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ permissions })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Update failed for ${docId}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  let cursor;
  let updated = 0;
  let skipped = 0;

  while (true) {
    const page = await listPage(cursor);
    if (page.documents.length === 0) break;

    for (const doc of page.documents) {
      const userId = doc.userId;
      if (!userId) {
        skipped++;
        continue;
      }
      const hasDelete = (doc.$permissions || []).some((p) => p.startsWith('delete('));
      if (hasDelete) {
        skipped++;
        continue;
      }

      const permissions = [`read("user:${userId}")`, `update("user:${userId}")`, `delete("user:${userId}")`];
      await patchPermissions(doc.$id, permissions);
      updated++;
      console.log(`Updated ${doc.$id} (user ${userId})`);
    }

    cursor = page.documents[page.documents.length - 1].$id;
    if (page.documents.length < 100) break;
  }

  console.log(`Done. Updated ${updated} document(s), skipped ${skipped} (already had delete or no userId).`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
