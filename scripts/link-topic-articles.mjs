// Links a topic (in health_topics or fitness_topics) to one or more
// articles by slug. Replaces the old health-only link-topic-articles.mjs.
//
// Usage:
//   APPWRITE_API_KEY=your_key node scripts/link-topic-articles.mjs <section> <topic-slug> <article-slug> [article-slug ...]
//
// <section> is "health" or "fitness".
//
// Example:
//   APPWRITE_API_KEY=xxxx node scripts/link-topic-articles.mjs health pregnancy nutrition-during-pregnancy-basics
//   APPWRITE_API_KEY=xxxx node scripts/link-topic-articles.mjs fitness physical-activity some-article-slug
//
// This REPLACES the topic's articleIds with the ones given. Delete the API
// key from the console afterwards.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';

const SECTION_COLLECTIONS = {
  health: 'health_topics',
  fitness: 'fitness_topics'
};

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error('Set APPWRITE_API_KEY before running this script.');
  process.exit(1);
}

const [section, topicSlug, ...articleSlugs] = process.argv.slice(2);
const topicCollectionId = SECTION_COLLECTIONS[section];
if (!topicCollectionId || !topicSlug || articleSlugs.length === 0) {
  console.error('Usage: node scripts/link-topic-articles.mjs <health|fitness> <topic-slug> <article-slug> [article-slug ...]');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'X-Appwrite-Project': PROJECT_ID,
  'X-Appwrite-Key': apiKey
};

async function findDocumentBySlug(collectionId, slug) {
  const query = JSON.stringify({ method: 'equal', attribute: 'slug', values: [slug] });
  const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents?queries[]=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Lookup failed for "${slug}" in ${collectionId}: ${json.message || res.status}`);
  }
  if ((json.total ?? 0) === 0) {
    throw new Error(`No document with slug "${slug}" found in ${collectionId}.`);
  }
  return json.documents[0];
}

async function updateDocument(collectionId, documentId, data) {
  const res = await fetch(`${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents/${documentId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ data })
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Update failed: ${json.message || res.status}`);
  }
  return json;
}

const topic = await findDocumentBySlug(topicCollectionId, topicSlug);
console.log(`Found ${section} topic "${topic.title}" (${topic.$id}).`);

const articleIds = [];
for (const slug of articleSlugs) {
  const article = await findDocumentBySlug('articles', slug);
  console.log(`  + "${article.title}" (${article.$id})`);
  articleIds.push(article.$id);
}

await updateDocument(topicCollectionId, topic.$id, { articleIds });
console.log(`Linked ${articleIds.length} article(s) to "${topicSlug}".`);
