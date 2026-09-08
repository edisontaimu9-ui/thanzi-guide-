// Talks to Appwrite's REST API directly with a server API key. This is the
// same thing an Appwrite Function would do internally via the server SDK —
// there's nothing a Function gets that a Worker doesn't here, since the API
// key is just a header, not something scoped to running inside Appwrite.

export interface Env {
  APPWRITE_ENDPOINT: string; // e.g. https://cloud.appwrite.io/v1
  APPWRITE_PROJECT_ID: string;
  APPWRITE_DATABASE_ID: string;
  APPWRITE_API_KEY: string; // secret — scopes: databases.read, databases.write, users.read
  APPWRITE_WEBHOOK_SECRET: string; // secret — the signing key from the webhook's settings page
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string; // secret
  VAPID_SUBJECT: string; // e.g. mailto:admin@thanziguide.example
}

const COLLECTIONS = {
  pushSubscriptions: 'push_subscriptions',
  notifications: 'notifications',
  profiles: 'profiles'
};

function headers(env: Env) {
  return {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': env.APPWRITE_PROJECT_ID,
    'X-Appwrite-Key': env.APPWRITE_API_KEY
  };
}

function qEqual(attribute: string, values: unknown[]): string {
  return JSON.stringify({ method: 'equal', attribute, values });
}

function qLimit(n: number): string {
  return JSON.stringify({ method: 'limit', values: [n] });
}

export interface PushSubscriptionDoc {
  $id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  authKey: string;
}

export async function listSubscriptionsForUser(env: Env, userId: string): Promise<PushSubscriptionDoc[]> {
  const url = new URL(
    `${env.APPWRITE_ENDPOINT}/databases/${env.APPWRITE_DATABASE_ID}/collections/${COLLECTIONS.pushSubscriptions}/documents`
  );
  url.searchParams.append('queries[]', qEqual('userId', [userId]));
  url.searchParams.append('queries[]', qLimit(50));

  const res = await fetch(url, { headers: headers(env) });
  if (!res.ok) throw new Error(`Appwrite list subscriptions failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { documents: PushSubscriptionDoc[] };
  return data.documents;
}

export async function deleteSubscription(env: Env, docId: string): Promise<void> {
  await fetch(
    `${env.APPWRITE_ENDPOINT}/databases/${env.APPWRITE_DATABASE_ID}/collections/${COLLECTIONS.pushSubscriptions}/documents/${docId}`,
    { method: 'DELETE', headers: headers(env) }
  ).catch(() => {});
}

export async function createNotificationDoc(
  env: Env,
  userId: string,
  title: string,
  body?: string,
  link?: string
): Promise<void> {
  const res = await fetch(
    `${env.APPWRITE_ENDPOINT}/databases/${env.APPWRITE_DATABASE_ID}/collections/${COLLECTIONS.notifications}/documents`,
    {
      method: 'POST',
      headers: headers(env),
      body: JSON.stringify({
        documentId: 'unique()',
        data: { userId, title, body, link, read: false },
        // Doc-level permissions so the user can read/update their own copy,
        // same as the client-side createNotification() helper.
        permissions: [`read("user:${userId}")`, `update("user:${userId}")`]
      })
    }
  );
  if (!res.ok) throw new Error(`Appwrite create notification failed: ${res.status} ${await res.text()}`);
}

// Confirms a caller is an authenticated admin before letting them trigger a
// broadcast. Pass the Appwrite session JWT the client sends in the
// Authorization header.
export async function verifyAdminJwt(env: Env, jwt: string): Promise<{ id: string } | null> {
  const res = await fetch(`${env.APPWRITE_ENDPOINT}/account`, {
    headers: {
      'X-Appwrite-Project': env.APPWRITE_PROJECT_ID,
      'X-Appwrite-JWT': jwt
    }
  });
  if (!res.ok) return null;
  const account = (await res.json()) as { $id: string; labels?: string[] };
  if (!account.labels?.some((l) => l.toLowerCase() === 'admin')) return null;
  return { id: account.$id };
}

// Example query for a cron job: users who haven't logged progress recently.
// Adjust the attribute/collection to whatever your `profiles` or
// `user_progress` schema actually tracks — this is illustrative.
export async function listUserIdsForReminder(env: Env, staleBefore: string): Promise<string[]> {
  const url = new URL(
    `${env.APPWRITE_ENDPOINT}/databases/${env.APPWRITE_DATABASE_ID}/collections/${COLLECTIONS.profiles}/documents`
  );
  url.searchParams.append('queries[]', JSON.stringify({ method: 'lessThan', attribute: 'lastActiveAt', values: [staleBefore] }));
  url.searchParams.append('queries[]', qLimit(100));

  const res = await fetch(url, { headers: headers(env) });
  if (!res.ok) return [];
  const data = (await res.json()) as { documents: { userId: string }[] };
  return data.documents.map((d) => d.userId);
}
