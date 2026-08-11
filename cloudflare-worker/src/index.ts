import { buildPushHTTPRequest } from '@pushforge/builder';
import {
  Env,
  PushSubscriptionDoc,
  createNotificationDoc,
  deleteSubscription,
  listSubscriptionsForUser,
  listUserIdsForReminder,
  verifyAdminJwt
} from './appwrite';
import { verifyAppwriteWebhook } from './verifyWebhook';

interface NotificationDoc {
  $id: string;
  userId: string;
  title: string;
  body?: string;
  link?: string;
}

interface PushMessage {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  [key: string]: unknown;
}

// Sends one push message to one subscription, pruning it from Appwrite if
// the push service says it's gone (410) or was never valid (404).
async function sendToSubscription(env: Env, sub: PushSubscriptionDoc, message: PushMessage): Promise<void> {
  const { endpoint, headers, body } = await buildPushHTTPRequest({
    privateJWK: env.VAPID_PRIVATE_KEY,
    subscription: {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.authKey }
    },
    message: {
      // Jsonifiable's generic inference gets confused by plain interfaces;
      // the payload is a plain JSON-serializable object at runtime.
      payload: message as unknown as Record<string, string>,
      adminContact: env.VAPID_SUBJECT,
      options: { ttl: 3600, urgency: 'normal' }
    }
  });

  const res = await fetch(endpoint, { method: 'POST', headers, body });
  if (res.status === 404 || res.status === 410) {
    await deleteSubscription(env, sub.$id);
  }
}

async function sendToUser(env: Env, userId: string, message: PushMessage): Promise<void> {
  const subs = await listSubscriptionsForUser(env, userId);
  await Promise.allSettled(subs.map((sub) => sendToSubscription(env, sub, message)));
}

// --- Route handlers -------------------------------------------------------

async function handleAppwriteWebhook(req: Request, env: Env): Promise<Response> {
  const rawBody = await req.text();
  const signature = req.headers.get('x-appwrite-webhook-signature');
  const ok = await verifyAppwriteWebhook(req.url, rawBody, signature, env.APPWRITE_WEBHOOK_SECRET);
  if (!ok) return new Response('Invalid signature', { status: 401 });

  const doc = JSON.parse(rawBody) as NotificationDoc;
  if (!doc.userId || !doc.title) return new Response('Ignored: not a notification doc', { status: 200 });

  await sendToUser(env, doc.userId, { title: doc.title, body: doc.body, url: doc.link, tag: doc.$id });
  return new Response('ok', { status: 200 });
}

// Admin-triggered broadcast to many users at once. Called from the app's
// admin console with the caller's Appwrite session JWT in the
// Authorization header (`Bearer <jwt>`).
async function handleBroadcast(req: Request, env: Env): Promise<Response> {
  const auth = req.headers.get('authorization') || '';
  const jwt = auth.replace(/^Bearer\s+/i, '');
  const admin = jwt ? await verifyAdminJwt(env, jwt) : null;
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const { userIds, title, body, url } = (await req.json()) as {
    userIds: string[];
    title: string;
    body?: string;
    url?: string;
  };
  if (!Array.isArray(userIds) || !title) return new Response('Bad request', { status: 400 });

  // Fan out in small batches so we don't blow past subrequest limits on
  // very large broadcasts.
  const batchSize = 25;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    await Promise.allSettled([
      ...batch.map((userId) => sendToUser(env, userId, { title, body, url })),
      ...batch.map((userId) => createNotificationDoc(env, userId, title, body, url))
    ]);
  }

  return new Response(JSON.stringify({ sent: userIds.length }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/webhooks/appwrite-notification') {
      return handleAppwriteWebhook(req, env);
    }
    if (req.method === 'POST' && url.pathname === '/api/broadcast') {
      return handleBroadcast(req, env);
    }
    if (url.pathname === '/health') {
      return new Response('ok');
    }
    return new Response('Not found', { status: 404 });
  },

  // Example scheduled reminder — adjust the query/copy to whatever
  // "come back and keep learning" trigger actually makes sense for Thanzi
  // Guide. Configure the schedule in wrangler.toml under [triggers].
  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const staleBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const userIds = await listUserIdsForReminder(env, staleBefore);

    for (const userId of userIds) {
      await createNotificationDoc(
        env,
        userId,
        "Haven't seen you in a while",
        'Your course is waiting whenever you have a few minutes.',
        '/courses'
      );
      // createNotificationDoc writes to the notifications collection, which
      // fires the Appwrite Webhook, which calls this same Worker's
      // /webhooks/appwrite-notification — so the push send happens through
      // that single existing path rather than being duplicated here.
    }
  }
};
