import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import { createNotification } from '@/lib/notifications';
import type { Models } from 'appwrite';

export type SenderRole = 'patient' | 'provider';

export interface MessageDoc extends Models.Document {
  appointmentId: string;
  senderId: string;
  senderRole: SenderRole;
  body: string;
}

export async function listMessages(appointmentId: string): Promise<MessageDoc[]> {
  const res = await databases.listDocuments<MessageDoc>(DB.databaseId, DB.collections.messages, [
    Query.equal('appointmentId', appointmentId),
    Query.orderAsc('$createdAt'),
    Query.limit(200)
  ]);
  return res.documents;
}

// Grants update/delete on the message to the sender only — a message can't
// grant read/write to some other specific user's ID from a regular client
// session (Appwrite only lets a session grant permissions for roles it
// actually holds, e.g. itself). Read access instead comes from the
// messages collection's own read("users") permission, the same pattern
// the appointments collection already uses. Privacy for who *sees* a
// thread is enforced by the app only ever querying by a specific
// appointmentId the viewer is a participant in (see AppointmentThread).
export async function sendMessage(params: {
  appointmentId: string;
  senderId: string;
  senderRole: SenderRole;
  body: string;
  recipientUserId?: string;
}): Promise<MessageDoc> {
  const { appointmentId, senderId, senderRole, body, recipientUserId } = params;

  const permissions = [Permission.update(Role.user(senderId)), Permission.delete(Role.user(senderId))];

  const message = await databases.createDocument<MessageDoc>(
    DB.databaseId,
    DB.collections.messages,
    ID.unique(),
    { appointmentId, senderId, senderRole, body },
    permissions
  );

  if (recipientUserId) {
    try {
      await createNotification(
        recipientUserId,
        'New message',
        body.length > 80 ? `${body.slice(0, 80)}…` : body,
        `/appointments/${appointmentId}/messages`
      );
    } catch (err) {
      console.warn('Failed to create message notification:', err);
    }
  } else {
    console.warn('sendMessage called without a recipientUserId — recipient likely has no linked account yet, skipping notification.');
  }

  return message;
}
