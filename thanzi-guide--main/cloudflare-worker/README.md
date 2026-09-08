# Thanzi Guide — Push Notification Worker

Handles all server-side Web Push work so the Appwrite Student plan's
2-Function limit is never touched. See `../PUSH_NOTIFICATIONS.md` for the
full architecture writeup.

## 1. Push the new Appwrite collection

The `push_subscriptions` collection is already added to the root
`appwrite.json`. From the repo root:

```bash
appwrite deploy collection
```

## 2. Generate a VAPID key pair

```bash
cd cloudflare-worker
npm install
npx @pushforge/builder vapid
```

Copy the **public** key into:
- `wrangler.toml` → `VAPID_PUBLIC_KEY`
- the app's `.env` → `VITE_VAPID_PUBLIC_KEY`

Keep the **private** key for step 4 — never put it in `wrangler.toml`, `.env`,
or anywhere committed to git.

## 3. Create an Appwrite server API key

Appwrite Console → project → Overview → Integrations → API keys. Scopes
needed: `databases.read`, `databases.write`. Nothing broader.

## 4. Set Worker secrets

```bash
wrangler secret put APPWRITE_API_KEY          # from step 3
wrangler secret put VAPID_PRIVATE_KEY         # from step 2
wrangler secret put APPWRITE_WEBHOOK_SECRET   # from step 5, once you have it
```

## 5. Deploy the Worker

```bash
wrangler deploy
```

Note the deployed URL, e.g. `https://thanzi-guide-push-worker.<you>.workers.dev`.

## 6. Create the Appwrite Webhook

Appwrite Console → project → Overview → Integrations → Webhooks → Add webhook.

- **URL**: `https://thanzi-guide-push-worker.<you>.workers.dev/webhooks/appwrite-notification`
- **Events**: `databases.*.collections.notifications.documents.*.create`
- Save, then copy the generated **signing secret** shown once — that's
  `APPWRITE_WEBHOOK_SECRET` from step 4.

This is a native Appwrite feature (Project Settings, not Functions) — it
doesn't touch your 2-Function limit.

## 7. Test it

Create a document in the `notifications` collection (via the app, or the
console) for a user who has an active push subscription — a notification
should arrive within a second or two. Check `wrangler tail` for logs if not.

## Endpoints

| Path | Purpose | Auth |
|---|---|---|
| `POST /webhooks/appwrite-notification` | Appwrite webhook target — sends push for a new notification doc | HMAC signature (Appwrite) |
| `POST /api/broadcast` | Admin bulk send to a list of `userIds` | `Authorization: Bearer <Appwrite session JWT>`, checks `admin` label |
| `GET /health` | Liveness check | none |
| `scheduled` (cron) | Weekly inactivity reminder, edit the query/copy as needed | Cloudflare-triggered, not public |

## Notes

- `@pushforge/builder` does VAPID signing entirely with WebCrypto — no
  Node.js crypto shims, so it runs natively on Workers.
- Dead subscriptions (device uninstalled, permission revoked, etc.) are
  pruned automatically whenever a push attempt returns 404/410.
- The `/api/broadcast` and `scheduled` handlers are intentionally minimal
  examples — wire the user-targeting query to whatever your `profiles` /
  `user_progress` schema actually supports.
