// Seeds subtopic cards under both Fitness topics:
//   Physical Activity -> Benefits of Exercise, Exercise Nutrition, Workout Ideas
//   Sports & Performance -> Beginner and Intermediate, Advanced
// Safe to re-run — skips any slug that already exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-fitness-subtopics.mjs

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'fitness_subtopics';

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

const subtopics = [
  {
    title: 'Benefits of Exercise',
    slug: 'benefits-of-exercise',
    parentSlug: 'physical-activity',
    order: 1,
    summary: 'Regular movement supports heart health, strength, mood, and sleep.',
    body: 'Regular physical activity is linked to a lower risk of heart disease, diabetes, and some cancers, along with stronger muscles and bones. It also supports mental health, often improving mood and sleep quality. Even moderate activity, like brisk walking most days, provides real benefits.'
  },
  {
    title: 'Exercise Nutrition',
    slug: 'exercise-nutrition',
    parentSlug: 'physical-activity',
    order: 2,
    summary: 'What and when you eat affects how your body performs and recovers.',
    body: 'Eating enough energy and staying hydrated supports exercise performance, while protein-containing foods after activity support muscle recovery. Needs vary with intensity and duration, casual exercisers usually don\'t need special products, just consistent, balanced meals around their activity.'
  },
  {
    title: 'Workout Ideas',
    slug: 'workout-ideas',
    parentSlug: 'physical-activity',
    order: 3,
    summary: 'Simple ways to build regular movement into daily life, no gym required.',
    body: 'Activity doesn\'t need a gym membership: brisk walking, bodyweight exercises at home, cycling, or active household chores all count. Building a routine around activities you enjoy and can keep up consistently matters more than any single "ideal" workout.'
  },
  {
    title: 'Beginner and Intermediate',
    slug: 'beginner-and-intermediate',
    parentSlug: 'sports-performance',
    order: 1,
    summary: 'Building a training habit safely, with nutrition that supports steady progress.',
    body: 'For those newer to structured training, gradually increasing activity, along with consistent meals and adequate hydration, helps the body adapt without overreaching. Recovery days and adequate sleep matter as much as the training itself at this stage.'
  },
  {
    title: 'Advanced',
    slug: 'advanced',
    parentSlug: 'sports-performance',
    order: 2,
    summary: 'Higher training loads call for more deliberate attention to fueling and recovery.',
    body: 'Athletes training at a competitive level typically need more calories, careful attention to protein and carbohydrate timing around training, and close attention to hydration. A sports dietitian can help tailor an eating plan to a specific sport, training schedule, and competition calendar.'
  }
];

for (const subtopic of subtopics) {
  if (await slugExists(subtopic.slug)) {
    console.log(`Skipping "${subtopic.slug}" — already exists.`);
    continue;
  }
  await createDocument(subtopic);
  console.log(`Created "${subtopic.slug}".`);
}

console.log('Done.');
