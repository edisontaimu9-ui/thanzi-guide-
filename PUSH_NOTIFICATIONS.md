# Push Notifications — Architecture

Designed to work within the Appwrite Student plan's **2-Function limit** —
the whole system uses **zero** Appwrite Functions. Everything that needs a
server runs on a single Cloudflare Worker instead.

## Why zero Functions is possible

Two things people usually assume need an Appwrite Function actually don't:

1. **"I need something to react to a new document."** Appwrite **Webhooks**
   (Project Settings → Webhooks) fire an HTTP POST to any URL on database
   events, with an HMAC signature you can verify. This is a separate feature
   from Functions and doesn't count against the Function limit.
2. **"I need privileged server-side database access."** A server API key
   works over Appwrite's plain REST API from *any* backend — a Cloudflare
   Worker calling `fetch()` with `X-Appwrite-Key` header has exactly the same
   access an Appwrite Function would have via the server SDK.

That leaves nothing that structurally requires running *inside* Appwrite.

## Data flow

```
 ┌────────────┐     write notifications doc      ┌──────────────────┐
 │   Client /  │ ───────────────────────────────▶ │   Appwrite DB     │
 │ CF Worker   │                                   │  notifications     │
 └────────────┘                                   └─────────┬─────────┘
                                                              │ Webhook (native,
                                                              │ HMAC-signed, not a
                                                              │ Function)
                                                              ▼
                                                   ┌────────────────────────┐
                                                   │  Cloudflare Worker      │
                                                   │  /webhooks/appwrite-    │
                                                   │  notification           │
                                                   │  - verify signature     │
                                                   │  - look up subscriptions│
                                                   │    (Appwrite REST + key)│
                                                   │  - sign + send Web Push │
                                                   │    (VAPID, WebCrypto)   │
                                                   │  - prune dead subs      │
                                                   └───────────┬────────────┘
                                                               ▼
                                                    Browser push service
                                                    (FCM / Mozilla / etc.)
                                                               ▼
                                                    Service worker `push` event
                                                    → showNotification()
```

## Responsibilities

**Appwrite** (Auth, Database, Webhooks — no Functions)
- Source of truth for `notifications` (in-app feed) and `push_subscriptions`
  (one doc per device, owned by the user via document-level permissions).
- Fires the webhook on every new `notifications` doc, regardless of what
  created it — client code, admin console, or the Worker's own cron job.

**Cloudflare Worker** (`/cloudflare-worker`)
- `POST /webhooks/appwrite-notification` — the only trigger for actually
  sending a push. Verifies the Appwrite HMAC signature, resolves the
  target user's subscriptions, sends via VAPID/WebCrypto, deletes
  subscriptions that come back 404/410.
- `POST /api/broadcast` — admin-only (Appwrite session JWT + `admin` label),
  for sending one message to many users at once.
- `scheduled` (Cron Trigger, `wrangler.toml`) — for recurring reminders.
  Writes `notifications` docs rather than sending push directly, so every
  send — whether from a user action, an admin broadcast, or a cron job —
  goes through the same signed webhook path. One code path, one place to
  get delivery right.

**Client** (`src/lib/push.ts`, `src/hooks/usePushNotifications.ts`)
- Requests notification permission, subscribes via `PushManager`, saves the
  subscription to Appwrite. That's it — no server logic on the client.

## Security

- VAPID private key and the Appwrite server API key live only as Cloudflare
  Worker secrets (`wrangler secret put ...`), never in the client bundle or
  in git.
- The Appwrite API key is scoped to `databases.read` / `databases.write`
  only — no account or user management scopes.
- The webhook endpoint verifies Appwrite's HMAC signature before doing
  anything, so an attacker who finds the Worker URL can't forge sends.
- The broadcast endpoint checks the caller's Appwrite session JWT and
  `admin` label before sending to arbitrary user lists.
- Each `push_subscriptions` doc is readable/writable only by the owning
  user (Appwrite document-level permissions) — the Worker reads across
  users only via its own server key, not a leaked user session.

## If you ever do need an Appwrite Function

Both slots stay free with this design. Good candidates if you use them
later: assigning role labels on signup (already flagged as a gap in the
main README), or a future AI feature — anything that specifically benefits
from running as an Appwrite-managed process rather than because nothing
else could do it.

## Setup

See `cloudflare-worker/README.md` for step-by-step deployment.
