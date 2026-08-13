// Seeds the "Men" life stage page. Safe to re-run — skips if the slug
// already exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-men-page.mjs

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'life_stage_pages';

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

async function slugExists(slug) {
  const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent(
    JSON.stringify({ method: 'equal', attribute: 'slug', values: [slug] })
  )}`;
  const res = await fetch(url, { headers });
  const json = await res.json();
  return (json.total ?? 0) > 0;
}

async function createDocument(data) {
  const res = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ documentId: 'unique()', data })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create "${data.slug}": ${json.message || res.status}`);
  }
  return json;
}

const page = {
  title: 'For Men',
  slug: 'men',
  intro: 'Nutrition needs and health risks shift across a man\'s life. Learn about eating well to support heart health, muscle, and overall wellbeing.'
};

if (await slugExists(page.slug)) {
  console.log(`Skipping "${page.slug}" — already exists.`);
} else {
  await createDocument(page);
  console.log(`Created "${page.slug}".`);
}

console.log('Done.');
