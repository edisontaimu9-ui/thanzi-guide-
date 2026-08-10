import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface ProfileDoc extends Models.Document {
  userId: string;
  name: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  preferences?: string;
}

export async function getProfile(userId: string): Promise<ProfileDoc | null> {
  const res = await databases.listDocuments<ProfileDoc>(DB.databaseId, DB.collections.profiles, [
    Query.equal('userId', userId),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}

// Creates a profile document for a user who doesn't have one yet. Every
// account gets a profile with the base USER role — elevated roles
// (EDITOR, NUTRITION_EXPERT, ADMIN) are granted by hand in the Appwrite
// console (assign the matching label there too, since that's what
// collection permissions actually check — see README).
export async function ensureProfile(userId: string, name: string): Promise<ProfileDoc> {
  const existing = await getProfile(userId);
  if (existing) return existing;

  return databases.createDocument<ProfileDoc>(
    DB.databaseId,
    DB.collections.profiles,
    ID.unique(),
    { userId, name, role: 'USER' },
    [Permission.read(Role.user(userId)), Permission.update(Role.user(userId))]
  );
}
