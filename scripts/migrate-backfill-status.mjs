// One-time migration: sets status='published' on every existing document in
// the 8 collections built before the draft/review workflow existed
// (health_topics, health_subtopics, fitness_topics, fitness_subtopics,
// recipe_categories, recipes, kids_stages, life_stage_pages). Without this,
// once the app starts filtering public queries by status='published',
// existing content (which has no status field yet) would disappear.
//
// Safe to re-run — skips documents that already have a status set.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/migrate-backfill-status.mjs
// Run this AFTER `appwrite push collection --all --force` has added the new
// status attribute to these collections.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';

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

const COLLECTIONS = [
  'health_topics',
  'health_subtopics',
  'fitness_topics',
  'fitness_subtopics',
  'recipe_categories',
  'recipes',
  'kids_stages',
  'life_stage_pages'
];

async function listAll(collectionId) {
  const res = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?limit=200`, {
    headers
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`List failed for ${collectionId}: ${json.message || res.status}`);
  return json.documents;
}

async function setPublished(collectionId, id) {
  const res = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ data: { status: 'published' } })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Update failed for ${collectionId}/${id}: ${json.message || res.status}`);
}

for (const collectionId of COLLECTIONS) {
  const docs = await listAll(collectionId);
  let updated = 0;
  for (const doc of docs) {
    if (doc.status) continue; // already set, skip
    await setPublished(collectionId, doc.$id);
    updated++;
  }
  console.log(`${collectionId}: ${updated} updated, ${docs.length - updated} already set.`);
}

console.log('Done.');
