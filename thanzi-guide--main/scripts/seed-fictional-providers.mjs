// Seeds 4 fictional providers for testing (Content Manager, booking flow,
// claim flow, etc). Uses clearly fake @example.com claim emails so nobody
// can accidentally match and claim them for real. Safe to re-run — skips
// any provider whose name already exists.
//
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-fictional-providers.mjs

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'providers';

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

async function nameExists(name) {
  const url = `${ENDPOINT}/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/documents?queries[]=${encodeURIComponent(
    JSON.stringify({ method: 'equal', attribute: 'name', values: [name] })
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
    throw new Error(`Failed to create "${data.name}": ${json.message || res.status}`);
  }
  return json;
}

const providers = [
  {
    name: 'Grace Mwale',
    title: 'Registered Dietitian',
    specialty: 'Maternal and child nutrition',
    bio: 'Grace works with expecting and new mothers on practical nutrition plans built around locally available foods, with a focus on the first 1,000 days.',
    location: 'Blantyre, Malawi',
    phone: '',
    whatsapp: '',
    status: 'active',
    claimEmail: 'grace.mwale.test@example.com'
  },
  {
    name: 'Thomas Banda',
    title: 'Clinical Nutritionist',
    specialty: 'Diabetes and cardiovascular nutrition',
    bio: 'Thomas specializes in nutrition support for chronic conditions like diabetes and hypertension, helping clients build sustainable eating habits alongside their medical care.',
    location: 'Lilongwe, Malawi',
    phone: '',
    whatsapp: '',
    status: 'active',
    claimEmail: 'thomas.banda.test@example.com'
  },
  {
    name: 'Chikondi Phiri',
    title: 'Registered Dietitian',
    specialty: 'Sports and performance nutrition',
    bio: 'Chikondi works with athletes and active individuals on fueling strategies for training, recovery, and everyday performance.',
    location: 'Zomba, Malawi',
    phone: '',
    whatsapp: '',
    status: 'active',
    claimEmail: 'chikondi.phiri.test@example.com'
  },
  {
    name: 'Esther Nyirenda',
    title: 'Pediatric Nutrition Specialist',
    specialty: 'Child growth and feeding',
    bio: 'Esther supports parents and caregivers with feeding guidance for infants and young children, from complementary feeding through the school-age years.',
    location: 'Mzuzu, Malawi',
    phone: '',
    whatsapp: '',
    status: 'active',
    claimEmail: 'esther.nyirenda.test@example.com'
  }
];

for (const provider of providers) {
  if (await nameExists(provider.name)) {
    console.log(`Skipping "${provider.name}" — already exists.`);
    continue;
  }
  await createDocument(provider);
  console.log(`Created "${provider.name}".`);
}

console.log('Done.');
