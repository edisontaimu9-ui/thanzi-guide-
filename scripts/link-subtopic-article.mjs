// Links a health subtopic card (e.g. "Protein" under "Essential Nutrients")
// to one article, powering the "Read the full article" button on that
// card's detail page.
//
// Usage:
//   APPWRITE_API_KEY=your_key node scripts/link-subtopic-article.mjs <subtopic-slug> <article-slug>
//
// Example:
//   APPWRITE_API_KEY=xxxx node scripts/link-subtopic-article.mjs protein understanding-macronutrients
//
// Delete the API key from the console afterwards.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error('Set APPWRITE_API_KEY before running this script.');
  process.exit(1);
}

const [subtopicSlug, articleSlug] = process.argv.slice(2);
if (!subtopicSlug || !articleSlug) {
  console.error('Usage: node scripts/link-subtopic-article.mjs <subtopic-slug> <article-slug>');
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

const subtopic = await findDocumentBySlug('health_subtopics', subtopicSlug);
const article = await findDocumentBySlug('articles', articleSlug);

await updateDocument('health_subtopics', subtopic.$id, { articleSlug: article.slug });
console.log(`Linked "${subtopic.title}" -> "${article.title}".`);
