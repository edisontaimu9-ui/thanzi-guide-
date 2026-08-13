// Adds the remaining Health Conditions subtopic cards not covered by the
// first curated batch: Allergies and Intolerances, Arthritis and
// Inflammation, Bone Health and Osteoporosis, Brain and Neurological
// Conditions, Cancer, Celiac Disease, Eating Disorders, Endocrine Disorders,
// Intellectual Disabilities. Safe to re-run — skips existing slugs.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-health-conditions-subtopics-2.mjs
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
    title: 'Allergies and Intolerances',
    slug: 'allergies-and-intolerances',
    order: 7,
    summary: 'Identifying trigger foods and eating safely and adequately around them.',
    body: 'Food allergies and intolerances mean certain foods need to be avoided, whether due to an immune reaction or difficulty digesting a specific component like lactose. The challenge is avoiding the trigger food while still meeting overall nutrition needs. A dietitian can help build a safe eating plan that doesn\'t leave out important nutrients.'
  },
  {
    title: 'Arthritis and Inflammation',
    slug: 'arthritis-and-inflammation',
    order: 8,
    summary: 'Diet patterns that may help manage joint pain and general inflammation.',
    body: 'While no diet cures arthritis, some eating patterns, such as those rich in fruits, vegetables, and fatty fish, and lower in processed foods, are associated with less inflammation. Maintaining a healthy body weight can also reduce strain on joints. These changes work alongside medical treatment, not instead of it.'
  },
  {
    title: 'Bone Health and Osteoporosis',
    slug: 'bone-health-and-osteoporosis',
    order: 9,
    summary: 'Calcium, vitamin D, and physical activity all play a role in keeping bones strong.',
    body: 'Bone health depends on adequate calcium and vitamin D over a lifetime, along with weight-bearing physical activity. Foods like small fish eaten with bones, dairy, and leafy greens can contribute calcium. Osteoporosis risk increases with age, so bone health is worth attention well before symptoms appear.'
  },
  {
    title: 'Brain and Neurological Conditions',
    slug: 'brain-and-neurological-conditions',
    order: 10,
    summary: 'How nutrition connects to brain health, memory, and neurological conditions.',
    body: 'Nutrition affects brain health throughout life, from early childhood development to conditions like stroke and dementia in later years. Adequate intake of key nutrients, along with managing conditions like high blood pressure and diabetes, supports long-term brain health. Specific neurological conditions may call for tailored dietary guidance from a specialist.'
  },
  {
    title: 'Cancer',
    slug: 'cancer',
    order: 11,
    summary: 'Nutrition support before, during, and after cancer treatment.',
    body: 'Nutrition needs during cancer treatment can shift significantly, since appetite, digestion, and energy needs are often affected by both the disease and the treatment. A dietitian working alongside the oncology team can help address treatment side effects and keep the body as strong as possible through the process.'
  },
  {
    title: 'Celiac Disease',
    slug: 'celiac-disease',
    order: 12,
    summary: 'Managing celiac disease means avoiding gluten completely, not just in moderation.',
    body: 'Celiac disease is an autoimmune condition where eating gluten, found in wheat, barley, and rye, damages the small intestine. Unlike some other conditions, there\'s no safe amount of gluten for someone with celiac disease, so a strict gluten-free diet is the main treatment. A dietitian can help identify gluten in less obvious places and plan balanced gluten-free meals.'
  },
  {
    title: 'Eating Disorders',
    slug: 'eating-disorders',
    order: 13,
    summary: 'Eating disorders are serious conditions that benefit from professional support.',
    body: 'Eating disorders involve a complex relationship with food, body image, and eating behavior, and can affect people of any age, gender, or background. Recovery typically involves a team that may include a doctor, therapist, and dietitian working together. If you or someone you know may be affected, reaching out to a health professional is an important first step.'
  },
  {
    title: 'Endocrine Disorders',
    slug: 'endocrine-disorders',
    order: 14,
    summary: 'Hormone-related conditions such as thyroid disorders often have a nutrition dimension.',
    body: 'Endocrine conditions, such as thyroid disorders, involve the body\'s hormone systems and can affect metabolism, energy levels, and weight. Nutrition support varies depending on the specific condition, so guidance is best built around a diagnosis from an endocrinologist or dietitian familiar with the condition.'
  },
  {
    title: 'Intellectual Disabilities',
    slug: 'intellectual-disabilities',
    order: 15,
    summary: 'Nutrition support tailored to individual needs, abilities, and routines.',
    body: 'People with intellectual disabilities may have specific nutrition considerations, from feeding difficulties to medication interactions or a higher risk of certain health conditions. Care is most effective when built around the individual, often involving caregivers, health workers, and sometimes a dietitian with experience in this area.'
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
