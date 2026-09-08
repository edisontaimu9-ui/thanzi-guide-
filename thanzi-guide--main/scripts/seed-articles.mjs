// Run once to seed article categories and a few starter articles.
// Requires a server-side Appwrite API key with databases write access.
//
// Usage (from project root, Termux or any Node 18+ environment):
//   APPWRITE_API_KEY=your_key_here node scripts/seed-articles.mjs
//
// The key only needs to exist for this one run — delete it from the
// Appwrite console afterwards (Overview → Integrations → API keys).

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error('Set APPWRITE_API_KEY before running this script.');
  process.exit(1);
}

async function createDocument(collectionId, data) {
  const res = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': apiKey
      },
      body: JSON.stringify({ documentId: 'unique()', data })
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create in ${collectionId}: ${json.message || res.status}`);
  }
  return json;
}

const categories = [
  { name: 'Nutrition basics', slug: 'nutrition-basics', type: 'article', description: 'What nutrition is and how it works.' },
  { name: 'Maternal nutrition', slug: 'maternal-nutrition', type: 'article', description: 'Nutrition during pregnancy and breastfeeding.' },
  { name: 'Child nutrition', slug: 'child-nutrition', type: 'article', description: 'Feeding infants and young children.' },
  { name: 'Food safety', slug: 'food-safety', type: 'article', description: 'Safe food handling, cooking, and storage.' }
];

const articles = {
  'nutrition-basics': [
    {
      title: 'What Is Nutrition?',
      slug: 'what-is-nutrition',
      summary: 'A plain-language introduction to nutrition and why it matters for health.',
      body: `Nutrition is the study of how the food you eat affects your body — how it gives you energy, helps you grow, and keeps your organs and systems working. Every food is made up of nutrients: carbohydrates, protein, fat, vitamins, minerals, fiber, and water. Your body needs a mix of these in the right amounts to function well.

Good nutrition isn't about one perfect food or avoiding entire food groups. It's about eating a variety of foods regularly, in amounts that match your body's needs, so you get enough energy and the full range of nutrients your body relies on.

Nutrition needs differ from person to person — they depend on age, sex, activity level, health conditions, and life stage (such as pregnancy or childhood growth). Because of this, general nutrition information is a starting point, not a personal prescription. For guidance specific to your situation, a registered dietitian or clinician is the right person to ask.`,
      sources: ['World Health Organization — Nutrition overview', 'Food and Agriculture Organization of the UN — Nutrition and food systems']
    },
    {
      title: 'Understanding Macronutrients: Carbohydrates, Protein and Fat',
      slug: 'understanding-macronutrients',
      summary: 'What carbohydrates, protein, and fat each do in the body, in plain terms.',
      body: `Macronutrients are the nutrients your body needs in the largest amounts: carbohydrates, protein, and fat. Each plays a different role.

Carbohydrates are the body's main source of energy. They're found in foods like nsima, rice, bread, cassava, sweet potatoes, and fruit. When you eat carbohydrates, your body breaks them down into glucose, which fuels your brain, muscles, and daily activity.

Protein is used to build and repair tissue — muscle, skin, and the cells that make up your organs and immune system. Foods like beans, groundnuts, soybeans, eggs, fish, and meat are protein sources.

Fat supports energy storage, helps your body absorb certain vitamins, and protects organs. It's found in foods like groundnut oil, avocado, nuts, and fatty fish. Fat has more energy per gram than carbohydrates or protein, which is part of why balance across all three matters.

Most meals naturally combine all three macronutrients — for example, beans and nsima together provide carbohydrates, protein, and some fat. Rather than tracking exact amounts, a practical starting point is building meals around a variety of foods from different groups.`,
      sources: ['World Health Organization — Healthy diet fact sheet']
    }
  ],
  'maternal-nutrition': [
    {
      title: 'Nutrition During Pregnancy: The Basics',
      slug: 'nutrition-during-pregnancy-basics',
      summary: 'General, non-clinical guidance on eating well during pregnancy.',
      body: `Pregnancy increases the body's need for energy and certain nutrients, since it's supporting both the mother and the growing baby. Eating a varied diet — including staples, legumes like beans and groundnuts, vegetables, fruit, and where possible some animal-source foods like eggs, fish, or milk — helps meet these increased needs.

Some nutrients get particular attention during pregnancy, including iron, folate, and calcium, because demand for them rises. Antenatal care visits are the right setting to discuss specific needs, since requirements vary and some are addressed through supplements prescribed by a health worker rather than diet alone.

This article is general information, not a substitute for antenatal care. If you're pregnant, regular visits to a clinic or health center — where a health worker can check on both your nutrition and the pregnancy directly — matter more than any single article.`,
      sources: ['World Health Organization — Antenatal care guidance']
    }
  ],
  'child-nutrition': [
    {
      title: 'Feeding Young Children: An Introduction',
      slug: 'feeding-young-children-introduction',
      summary: 'A general overview of how feeding needs change in early childhood.',
      body: `Young children have small stomachs but high energy and nutrient needs relative to their size, because they're growing quickly. This is part of why feeding recommendations for children differ from those for adults — children often need to eat more frequently, with foods that are energy- and nutrient-dense for their portion size.

Exclusive breastfeeding is recommended for the first six months of life by international health guidance, after which complementary foods are gradually introduced alongside continued breastfeeding. The transition to family foods happens gradually over the following months and years.

Because a child's nutrition needs and growth should be tracked individually — often through growth monitoring at a clinic — this article gives general context only. A health worker or clinic growth check is the right place to get guidance specific to a particular child.`,
      sources: ['World Health Organization — Infant and young child feeding']
    }
  ],
  'food-safety': [
    {
      title: 'Everyday Food Safety at Home',
      slug: 'everyday-food-safety-at-home',
      summary: 'General, widely-recommended practices for handling and preparing food safely.',
      body: `Food safety is about reducing the risk of illness from the food you eat and prepare. A few widely recommended habits go a long way:

Wash your hands with soap before preparing food and before eating. Keep raw meat, fish, and their juices away from other foods, especially foods that won't be cooked afterward, to avoid cross-contamination. Cook foods — especially meat, poultry, and eggs — until they're thoroughly done, not just browned on the outside. Store leftovers promptly and reheat them thoroughly before eating again. Keep food preparation surfaces and utensils clean, and use clean water for washing food and cooking where possible.

These are general practices recommended by public health organizations, not a complete food safety guide. If you're dealing with a specific concern — like food that may already be spoiled, or symptoms after eating — that's a question for a health worker rather than general guidance.`,
      sources: ['World Health Organization — Five keys to safer food']
    }
  ]
};

async function main() {
  const categoryIds = {};

  for (const category of categories) {
    const doc = await createDocument('categories', category);
    categoryIds[category.slug] = doc.$id;
    console.log(`Created category: ${category.name} (${doc.$id})`);
  }

  const now = new Date().toISOString();

  for (const [categorySlug, categoryArticles] of Object.entries(articles)) {
    for (const article of categoryArticles) {
      const doc = await createDocument('articles', {
        ...article,
        categoryId: categoryIds[categorySlug],
        status: 'published',
        publishedAt: now,
        updatedAt: now
      });
      console.log(`Created article: ${article.title} (${doc.$id})`);
    }
  }

  console.log('\nDone. Remember to delete the API key from the Appwrite console now.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
