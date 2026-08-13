// Seeds a curated set of Health Conditions subtopic cards, chosen for
// relevance to a Malawian audience: Diabetes, Cardiovascular Health &
// Hypertension, Kidney Disease, Malnutrition and Deficiencies, HIV/AIDS,
// and Digestive and Gastrointestinal. Safe to re-run — skips existing slugs.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-health-conditions-subtopics.mjs
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

const parentSlug = 'health-conditions';

const subtopics = [
  {
    title: 'Diabetes',
    slug: 'diabetes',
    order: 1,
    summary: 'Managing blood sugar through food choices, meal timing, and portion balance.',
    body: 'Nutrition plays a central role in managing diabetes, alongside any prescribed medication. Balancing carbohydrate intake, choosing foods with a gentler effect on blood sugar, and eating regular meals all support blood sugar management. A dietitian can help build a specific eating plan around a diagnosis and any other health conditions.'
  },
  {
    title: 'Cardiovascular Health and Hypertension',
    slug: 'cardiovascular-health-and-hypertension',
    order: 2,
    summary: 'Diet-related habits that support heart health and help manage blood pressure.',
    body: 'Reducing salt intake, limiting saturated fat, and eating more fruits, vegetables, and whole grains are common recommendations for supporting cardiovascular health and managing high blood pressure. These changes work alongside, not instead of, any medication prescribed by a clinician.'
  },
  {
    title: 'Kidney Disease',
    slug: 'kidney-disease',
    order: 3,
    summary: 'Kidney conditions often call for specific limits on protein, potassium, phosphorus, and sodium.',
    body: 'Diet needs for kidney disease vary significantly depending on the stage and whether someone is on dialysis. Limits on protein, potassium, phosphorus, and sodium are common, but exact amounts should come from a renal dietitian working alongside the treating clinician, since getting them wrong can be harmful.'
  },
  {
    title: 'Malnutrition and Deficiencies',
    slug: 'malnutrition-and-deficiencies',
    order: 4,
    summary: 'Recognizing and addressing both undernutrition and specific nutrient deficiencies.',
    body: 'Malnutrition covers both not getting enough nutrients and, less commonly, getting too many. In Malawi, common concerns include stunting and wasting in children, and deficiencies in iron, vitamin A, iodine, and zinc. Growth monitoring and screening tools help identify malnutrition early, when treatment is most effective.'
  },
  {
    title: 'HIV/AIDS',
    slug: 'hiv-aids',
    order: 5,
    summary: 'Good nutrition supports the immune system and helps the body respond to treatment.',
    body: 'Nutrition support is an important part of care for people living with HIV. Adequate energy, protein, and micronutrient intake helps maintain strength and supports the immune system, particularly alongside antiretroviral treatment. A health worker can advise on nutrition support specific to a person\'s treatment stage.'
  },
  {
    title: 'Digestive and Gastrointestinal',
    slug: 'digestive-and-gastrointestinal',
    order: 6,
    summary: 'Diet adjustments that can ease common digestive conditions and symptoms.',
    body: 'Digestive conditions such as diarrhea, ulcers, and irritable bowel symptoms often respond to specific dietary adjustments, such as changes in fiber intake, hydration, or avoiding trigger foods. Persistent or severe digestive symptoms should be assessed by a health worker, since some conditions need medical treatment rather than diet changes alone.'
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
