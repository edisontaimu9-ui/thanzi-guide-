// Seeds subtopic cards under the "Essential Nutrients" health topic:
// Vitamins, Minerals, Protein, Fats, Water, Carbohydrates, Supplements.
// Safe to re-run — skips any slug that already exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-essential-nutrients-subtopics.mjs
// Delete the API key from the console afterwards.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'health_subtopics';

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

const parentSlug = 'essential-nutrients';

const subtopics = [
  {
    title: 'Vitamins',
    slug: 'vitamins',
    order: 1,
    summary: 'Small amounts, big impact — vitamins support everything from vision to immunity.',
    body: 'Vitamins are compounds your body needs in small amounts to function properly. Some, like vitamin C, come from fruits and vegetables. Others, like vitamin D, your body can make from sunlight. A varied diet is usually the best way to get the range of vitamins your body needs.'
  },
  {
    title: 'Minerals',
    slug: 'minerals',
    order: 2,
    summary: 'Iron, calcium, zinc, and more — minerals your body relies on daily.',
    body: 'Minerals are elements your body needs for processes like building bone, carrying oxygen in blood, and keeping nerves and muscles working. Common Malawian foods like beans, groundnuts, and leafy greens are useful sources of several key minerals.'
  },
  {
    title: 'Protein',
    slug: 'protein',
    order: 3,
    summary: 'Builds and repairs the tissues that make up your body.',
    body: 'Protein is used to build and repair muscle, skin, and the cells that make up your organs and immune system. Beans, groundnuts, soybeans, eggs, fish, and meat are all protein sources found in Malawian diets.'
  },
  {
    title: 'Fats',
    slug: 'fats',
    order: 4,
    summary: 'Not all fats are equal — some support health more than others.',
    body: 'Fat supports energy storage, helps your body absorb certain vitamins, and protects organs. Groundnut oil, avocado, nuts, and fatty fish are sources of fats that are generally considered more healthful than heavily processed or fried options.'
  },
  {
    title: 'Water',
    slug: 'water',
    order: 5,
    summary: 'Staying adequately hydrated supports nearly every body function.',
    body: 'Water is essential for digestion, temperature regulation, and nutrient transport. Needs vary by climate, activity level, and body size, but a simple habit of drinking water throughout the day, not just when thirsty, helps most people stay adequately hydrated.'
  },
  {
    title: 'Carbohydrates',
    slug: 'carbohydrates',
    order: 6,
    summary: 'Found in a variety of foods, carbohydrates fuel the body with energy.',
    body: 'Carbohydrates are the body\'s main source of energy. They are found in foods like nsima, rice, bread, cassava, and sweet potatoes. When eaten, your body breaks carbohydrates down into glucose, which fuels your brain, muscles, and daily activity.'
  },
  {
    title: 'Supplements',
    slug: 'supplements',
    order: 7,
    summary: 'When food alone may not be enough, and when to ask a professional first.',
    body: 'Most people can meet their nutrient needs through food. Supplements may be recommended in specific situations, such as during pregnancy or for a diagnosed deficiency, but they are not a substitute for a varied diet. Speak with a health worker or dietitian before starting a supplement.'
  }
];

for (const subtopic of subtopics) {
  if (await slugExists(subtopic.slug)) {
    console.log(`Skipping "${subtopic.slug}" — already exists.`);
    continue;
  }
  await createDocument({ ...subtopic, parentSlug });
  console.log(`Created "${subtopic.slug}".`);
}

console.log('Done.');
