// Seeds the Kids life-stage cards: For Baby, For Toddler, For Preschooler,
// For Gradeschooler, For Teen. Safe to re-run — skips any slug that already
// exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-kids-stages.mjs

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'kids_stages';

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

const stages = [
  {
    title: 'For Baby',
    slug: 'for-baby',
    order: 1,
    summary: 'From exclusive breastfeeding to the first complementary foods.',
    body: 'The first year brings the fastest growth a child will ever experience. Exclusive breastfeeding is recommended for the first six months, after which complementary foods are gradually introduced alongside continued breastfeeding. Growth monitoring at a clinic is the best way to track a baby\'s progress individually.'
  },
  {
    title: 'For Toddler',
    slug: 'for-toddler',
    order: 2,
    summary: 'Small stomachs, big needs — frequent, nutrient-dense meals matter most.',
    body: 'Toddlers have small stomachs but high energy and nutrient needs relative to their size, so frequent meals and snacks with energy- and nutrient-dense foods work better than three large meals. This is also a stage where new foods, textures, and self-feeding skills are being introduced, often with some pickiness along the way.'
  },
  {
    title: 'For Preschooler',
    slug: 'for-preschooler',
    order: 3,
    summary: 'Building lasting eating habits as independence and appetite grow.',
    body: 'Preschool-age children are developing more independence around eating, along with stronger food preferences. Offering a variety of foods regularly, modeling healthful eating, and keeping mealtimes low-pressure all support the development of good lifelong eating habits during this stage.'
  },
  {
    title: 'For Gradeschooler',
    slug: 'for-gradeschooler',
    order: 4,
    summary: 'Steady growth, more activity, and the start of more independent food choices.',
    body: 'School-age children are more active and making more of their own food choices, including at school. Regular meals, balanced packed lunches or school meals, and involving children in food preparation can help build good habits during a stage where outside influences on eating start to grow.'
  },
  {
    title: 'For Teen',
    slug: 'for-teen',
    order: 5,
    summary: 'A second major growth spurt with rising nutrient needs, especially iron and calcium.',
    body: 'Adolescence brings a second major growth spurt, along with rising needs for nutrients like iron and calcium. Teens are also increasingly responsible for their own food choices, so nutrition guidance at this stage often works best when it\'s practical and respects their growing independence, rather than being overly restrictive.'
  }
];

for (const stage of stages) {
  if (await slugExists(stage.slug)) {
    console.log(`Skipping "${stage.slug}" — already exists.`);
    continue;
  }
  await createDocument(stage);
  console.log(`Created "${stage.slug}".`);
}

console.log('Done.');
