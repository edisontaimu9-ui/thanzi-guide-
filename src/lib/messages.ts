import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
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

// Grants read/write on the message to exactly the two participants (the
// patient and the provider's linked account), nobody else — including
// other providers or plain users — can see it, even though the messages
// collection allows any signed-in user to create a document.
export async function sendMessage(params: {
  appointmentId: string;
  senderId: string;
  senderRole: SenderRole;
  body: string;
  patientUserId: string;
  providerUserId: string;
}): Promise<MessageDoc> {
  const { appointmentId, senderId, senderRole, body, patientUserId, providerUserId } = params;

  const permissions = [
    Permission.read(Role.user(patientUserId)),
    Permission.read(Role.user(providerUserId)),
    Permission.update(Role.user(patientUserId)),
    Permission.update(Role.user(providerUserId)),
    Permission.delete(Role.user(patientUserId)),
    Permission.delete(Role.user(providerUserId))
  ];

  return databases.createDocument<MessageDoc>(
    DB.databaseId,
    DB.collections.messages,
    ID.unique(),
    { appointmentId, senderId, senderRole, body },
    permissions
  );
}
