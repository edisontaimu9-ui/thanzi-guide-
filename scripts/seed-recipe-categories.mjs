// Seeds the recipe category cards: Breakfast, Entrees, Salads, Snacks and
// Sides, Soups and Stews, Baby Food, Beverages, Desserts. No individual
// recipes are seeded, categories start empty until real recipes are added.
// Safe to re-run — skips any slug that already exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-recipe-categories.mjs

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'recipe_categories';

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

const categories = [
  { title: 'Breakfast', slug: 'breakfast', order: 1, summary: 'Start the day with balanced, energy-giving meals.' },
  { title: 'Entrees', slug: 'entrees', order: 2, summary: 'Main dishes built around Malawian staples and proteins.' },
  { title: 'Salads', slug: 'salads', order: 3, summary: 'Fresh, vegetable-forward dishes for any meal.' },
  { title: 'Snacks and Sides', slug: 'snacks-and-sides', order: 4, summary: 'Lighter dishes to accompany a meal or eat on their own.' },
  { title: 'Soups and Stews', slug: 'soups-and-stews', order: 5, summary: 'Warming, hearty dishes built around vegetables, beans, or meat.' },
  { title: 'Baby Food', slug: 'baby-food', order: 6, summary: 'Soft, nutrient-dense foods suited to young children.' },
  { title: 'Beverages', slug: 'beverages', order: 7, summary: 'Drinks that add nutrition and hydration to the day.' },
  { title: 'Desserts', slug: 'desserts', order: 8, summary: 'Sweet dishes made with wholesome ingredients.' }
];

for (const category of categories) {
  if (await slugExists(category.slug)) {
    console.log(`Skipping "${category.slug}" — already exists.`);
    continue;
  }
  await createDocument(category);
  console.log(`Created "${category.slug}".`);
}

console.log('Done.');
