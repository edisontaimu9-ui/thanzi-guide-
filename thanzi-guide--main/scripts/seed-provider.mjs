// Seeds one mock provider ("Edison Taimu", a dietitian) with a handful of
// upcoming bookable slots, so the Find a Dietitian / booking flow has
// something real to click through before real providers are added.
// Usage: APPWRITE_API_KEY=your_key node scripts/seed-provider.mjs
// Delete the API key from the console after running.

const ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7967cf000f28e73c22';
const DATABASE_ID = 'thanzi_guide';

const apiKey = process.env.APPWRITE_API_KEY;
if (!apiKey) {
  console.error('Set APPWRITE_API_KEY before running this script.');
  process.exit(1);
}

async function createDocument(collectionId, data, permissions) {
  const res = await fetch(
    `${ENDPOINT}/databases/${DATABASE_ID}/collections/${collectionId}/documents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
        'X-Appwrite-Key': apiKey
      },
      body: JSON.stringify({ documentId: 'unique()', data, permissions })
    }
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to create in ${collectionId}: ${json.message || res.status}`);
  }
  return json;
}

// Returns a Date at the given hour/minute, n weekdays from today (skips
// weekends), so the seeded slots always land on upcoming working days
// regardless of when the script is run.
function nextWeekday(offsetWeekdays, hour, minute) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  let remaining = offsetWeekdays;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  // If offset is 0 and today is a weekend, roll forward to Monday.
  if (offsetWeekdays === 0) {
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

async function main() {
  const provider = await createDocument('providers', {
    name: 'Edison Taimu',
    title: 'Registered Dietitian',
    specialty: 'General nutrition & weight management',
    bio: 'Edison offers one-on-one nutrition consultations, helping people build practical, sustainable eating habits based on locally available foods.',
    location: 'Lilongwe, Malawi',
    phone: '',
    whatsapp: '',
    status: 'active'
  });
  console.log(`Created provider: ${provider.$id} (${provider.name})`);

  const slotTimes = [
    [0, 9, 0],
    [0, 14, 0],
    [1, 10, 0],
    [1, 15, 30],
    [2, 9, 30],
    [3, 11, 0],
    [4, 13, 0]
  ];

  for (const [offset, hour, minute] of slotTimes) {
    const date = nextWeekday(offset, hour, minute);
    const slot = await createDocument('appointment_slots', {
      providerId: provider.$id,
      startTime: date.toISOString(),
      durationMinutes: 30
    });
    console.log(`Created slot: ${slot.$id} — ${date.toString()}`);
  }

  console.log('\nDone. Remember to delete the API key from the Appwrite console now.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
