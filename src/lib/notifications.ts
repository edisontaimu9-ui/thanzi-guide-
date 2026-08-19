import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface NotificationDoc extends Models.Document {
  userId: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  // Set only by the functions/appointment-notifications server-side
  // function (e.g. "<appointmentId>:confirmed:patient"), never by client
  // code. Backed by a unique index — see
  // scripts/apply-notification-dedupe-schema.sh — so a retried event can't
  // create a duplicate notification. Client-created notifications (the
  // ones in this file) leave it unset.
  dedupeKey?: string;
}

export async function listNotifications(userId: string): Promise<NotificationDoc[]> {
  const res = await databases.listDocuments<NotificationDoc>(DB.databaseId, DB.collections.notifications, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(30)
  ]);
  return res.documents;
}

// Called from wherever something notification-worthy happens for a user —
// currently just appointment booking, but the same helper works for any
// future trigger (course completion, partner inquiry reply, etc.).
export async function createNotification(
  userId: string,
  title: string,
  body?: string,
  link?: string
): Promise<NotificationDoc> {
  return databases.createDocument<NotificationDoc>(
    DB.databaseId,
    DB.collections.notifications,
    ID.unique(),
    { userId, title, body, link, read: false },
    [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  await databases.updateDocument(DB.databaseId, DB.collections.notifications, id, { read: true });
}

export async function markAllNotificationsRead(notifications: NotificationDoc[]): Promise<void> {
  await Promise.all(
    notifications.filter((n) => !n.read).map((n) => markNotificationRead(n.$id))
  );
}

export async function deleteNotification(id: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, DB.collections.notifications, id);
}

export async function clearAllNotifications(notifications: NotificationDoc[]): Promise<void> {
  await Promise.all(notifications.map((n) => deleteNotification(n.$id)));
}
