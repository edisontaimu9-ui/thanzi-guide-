// Seeds subtopic cards under the "Pregnancy" health topic:
// Fertility and Reproduction, Prenatal Nutrition, Breastfeeding and Formula,
// Baby's First Foods. Safe to re-run — skips any slug that already exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-pregnancy-subtopics.mjs
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

const parentSlug = 'pregnancy';

const subtopics = [
  {
    title: 'Fertility and Reproduction',
    slug: 'fertility-and-reproduction',
    order: 1,
    summary: 'To prepare for pregnancy and support fertility, eat a balanced diet with foods that deliver key nutrients.',
    body: 'A balanced diet before pregnancy can support fertility and give the body a strong foundation. Foods rich in folate, iron, and healthy fats are especially useful when preparing for pregnancy, alongside general habits like regular meals and adequate hydration. A health worker can advise on anything specific to your situation.'
  },
  {
    title: 'Prenatal Nutrition',
    slug: 'prenatal-nutrition',
    order: 2,
    summary: 'A balanced eating plan that includes a variety of foods can provide adequate and important nutrients for a healthy pregnancy.',
    body: 'Pregnancy increases the body\'s need for energy and certain nutrients, since it is supporting both the mother and the growing baby. Eating a varied diet, including staples, legumes like beans and groundnuts, vegetables, fruit, and where possible some animal-source foods like eggs, fish, or milk, helps meet these increased needs. Iron, folate, and calcium get particular attention during pregnancy. Antenatal care visits are the right setting to discuss specific needs.'
  },
  {
    title: 'Breastfeeding and Formula',
    slug: 'breastfeeding-and-formula',
    order: 3,
    summary: 'While there are many benefits to breastfeeding, there are circumstances when infant formula is chosen to feed a baby the nutrition they need.',
    body: 'Exclusive breastfeeding is recommended for the first six months of life by international health guidance. Breast milk provides most of what an infant needs during this period. In some circumstances, infant formula is used instead, or alongside breastfeeding, to meet a baby\'s nutrition needs. A health worker can help with feeding questions specific to a baby\'s situation.'
  },
  {
    title: "Baby's First Foods",
    slug: 'babys-first-foods',
    order: 4,
    summary: 'Introducing complementary foods around six months supports a growing baby\'s increasing nutrition needs.',
    body: 'Around six months, babies begin needing more nutrients than breast milk alone provides, and complementary foods are gradually introduced alongside continued breastfeeding. Soft, mashed foods like well-cooked porridge, mashed beans, and pureed vegetables or fruit are common starting points. Growth is best tracked individually through a clinic or growth monitoring visit.'
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
