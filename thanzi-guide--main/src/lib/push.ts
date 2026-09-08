import { databases, DB, Permission, Role } from '@/lib/appwrite';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Web Push wants the VAPID public key as a raw Uint8Array, but it's easiest
// to store/copy as a base64url string in env vars — convert here.
function urlBase64ToUint8Array(base64Url: string): BufferSource {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes.buffer;
}

// A deterministic document ID from the push endpoint means re-subscribing
// the same device (e.g. after clearing the subscription) just overwrites
// the existing doc instead of accumulating duplicates.
async function endpointDocId(endpoint: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, 36); // Appwrite doc IDs cap at 36 chars
}

export async function getPushPermissionState(): Promise<NotificationPermission | 'unsupported'> {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

// Requests permission (if needed), subscribes the browser to Web Push, and
// saves the subscription to Appwrite so the Cloudflare Worker can find it
// later. Safe to call again on an already-subscribed device (upserts).
export async function subscribeToPush(userId: string): Promise<void> {
  if (!pushSupported()) throw new Error('Push notifications are not supported in this browser.');
  if (!VAPID_PUBLIC_KEY) throw new Error('Missing VITE_VAPID_PUBLIC_KEY env var.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
  }

  const json = sub.toJSON();
  const docId = await endpointDocId(json.endpoint!);

  await databases.createDocument(
    DB.databaseId,
    DB.collections.pushSubscriptions,
    docId,
    {
      userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      authKey: json.keys?.auth,
      userAgent: navigator.userAgent.slice(0, 255)
    },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId))
    ]
  ).catch(async (err: any) => {
    // Doc already exists (same device re-subscribing) — update it instead.
    if (err?.code === 409) {
      await databases.updateDocument(DB.databaseId, DB.collections.pushSubscriptions, docId, {
        userId,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        authKey: json.keys?.auth,
        userAgent: navigator.userAgent.slice(0, 255)
      });
    } else {
      throw err;
    }
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  const endpoint = sub.endpoint;
  await sub.unsubscribe();

  const docId = await endpointDocId(endpoint);
  await databases.deleteDocument(DB.databaseId, DB.collections.pushSubscriptions, docId).catch(() => {
    // Doc may already be gone (e.g. Worker pruned it after a 410) — fine.
  });
}
