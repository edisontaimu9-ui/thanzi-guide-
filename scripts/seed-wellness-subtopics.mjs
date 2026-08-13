// Seeds subtopic cards under the "Wellness" health topic: Nutrition Panels
// and Food Labels, Diet Trends, Healthful Habits, Mental Health, Vegetarian
// and Plant-Based, Weight and Body Positivity. "Awareness Campaigns" is
// intentionally excluded. Safe to re-run — skips existing slugs.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-wellness-subtopics.mjs
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

const parentSlug = 'wellness';

const subtopics = [
  {
    title: 'Nutrition Panels and Food Labels',
    slug: 'nutrition-panels-and-food-labels',
    order: 1,
    summary: 'Reading food labels helps you understand what you\'re actually eating.',
    body: 'Nutrition labels on packaged food list ingredients, serving sizes, and nutrient amounts, giving a quick way to compare products and understand what\'s in your food. Checking the ingredient list, not just the front-of-pack claims, is often the most useful habit, since the first few ingredients make up most of the product.'
  },
  {
    title: 'Diet Trends',
    slug: 'diet-trends',
    order: 2,
    summary: 'Popular diet trends come and go — a critical eye helps separate solid advice from hype.',
    body: 'New diet trends appear regularly, often promising quick results. Some borrow genuinely useful ideas, like eating more vegetables, while others cut out entire food groups or make claims that aren\'t well supported by evidence. Before trying a trend, it\'s worth asking whether it\'s realistic to sustain long-term and whether it fits your own health needs, ideally with input from a dietitian.'
  },
  {
    title: 'Healthful Habits',
    slug: 'healthful-habits',
    order: 3,
    summary: 'Small, sustainable habits often matter more than any single perfect meal.',
    body: 'Lasting wellness tends to come from consistent habits rather than short bursts of strict change: regular meals, a variety of foods, enough sleep, staying active, and drinking enough water. Building habits gradually, one at a time, is usually more sustainable than trying to change everything at once.'
  },
  {
    title: 'Mental Health',
    slug: 'mental-health',
    order: 4,
    summary: 'Physical and mental health are closely connected, including through nutrition.',
    body: 'What we eat, how we sleep, and how active we are all interact with mental wellbeing, and the reverse is true too, since stress and mood can affect appetite and eating patterns. Persistent changes in mood, sleep, or appetite are worth discussing with a health worker, since nutrition alone isn\'t a substitute for mental health care.'
  },
  {
    title: 'Vegetarian and Plant-Based',
    slug: 'vegetarian-and-plant-based',
    order: 5,
    summary: 'Plant-based eating can be nutritionally complete with some planning.',
    body: 'Vegetarian and plant-based diets can meet all of the body\'s nutrition needs, but they benefit from some attention to nutrients that are more concentrated in animal foods, such as iron, vitamin B12, and protein. Combining beans, groundnuts, whole grains, and vegetables across the day is a practical way to build complete, balanced plant-based meals.'
  },
  {
    title: 'Weight and Body Positivity',
    slug: 'weight-and-body-positivity',
    order: 6,
    summary: 'Health looks different across bodies, and wellbeing is about more than a number on a scale.',
    body: 'Body weight is influenced by many factors beyond diet, including genetics, health conditions, and life circumstances, and it\'s only one part of overall health. A body-positive approach focuses on sustainable, healthful habits and how you feel, rather than chasing a specific number. Anyone with weight-related health concerns is best supported by a health worker or dietitian who can look at the full picture.'
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
