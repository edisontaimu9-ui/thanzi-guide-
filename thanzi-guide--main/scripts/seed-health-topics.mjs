// Seeds the four starter Health topics (Essential Nutrients, Pregnancy,
// Health Conditions, Wellness) so the /health page has real content instead
// of showing "No health topics yet". Safe to re-run — it skips any slug
// that already exists.
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-health-topics.mjs
// Delete the API key from the console after running.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'health_topics';

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
    title: 'Essential Nutrients',
    slug: 'essential-nutrients',
    order: 1,
    body: 'Get to know the vitamins, minerals, protein, carbohydrates, and fats your body needs every day, and where to find them in everyday Malawian foods.'
  },
  {
    title: 'Pregnancy',
    slug: 'pregnancy',
    order: 2,
    body: 'Nutrition needs shift during pregnancy. Guidance on the extra nutrients that matter most, common concerns, and eating well through each trimester.'
  },
  {
    title: 'Health Conditions',
    slug: 'health-conditions',
    order: 3,
    body: 'How nutrition can help manage common health conditions such as diabetes, high blood pressure, and kidney disease, alongside medical care.'
  },
  {
    title: 'Wellness',
    slug: 'wellness',
    order: 4,
    body: 'Beyond individual nutrients, overall wellness ties together diet, activity, sleep, and mental health. Simple habits that support your wellbeing as a whole.'
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
