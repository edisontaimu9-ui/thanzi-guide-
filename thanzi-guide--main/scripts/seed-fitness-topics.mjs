// Seeds the two starter Fitness topics: Physical Activity and Sports &
// Performance. Safe to re-run — skips any slug that already exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-fitness-topics.mjs

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'fitness_topics';

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

const topics = [
  {
    title: 'Physical Activity',
    slug: 'physical-activity',
    order: 1,
    body: 'Regular movement supports nearly every part of health, from heart and bone strength to mood and sleep. Learn about the benefits of exercise, how to fuel your body for activity, and simple ways to build movement into daily life.'
  },
  {
    title: 'Sports & Performance',
    slug: 'sports-performance',
    order: 2,
    body: 'Whether you\'re just starting out or training seriously, how you eat affects performance and recovery. Get guidance suited to different training levels, from beginner routines to advanced competitive nutrition.'
  }
];

for (const topic of topics) {
  if (await slugExists(topic.slug)) {
    console.log(`Skipping "${topic.slug}" — already exists.`);
    continue;
  }
  await createDocument(topic);
  console.log(`Created "${topic.slug}".`);
}

console.log('Done.');
