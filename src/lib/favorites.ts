import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface FavoriteDoc extends Models.Document {
  userId: string;
  foodId: string;
}

export async function listFavorites(userId: string): Promise<FavoriteDoc[]> {
  const res = await databases.listDocuments<FavoriteDoc>(DB.databaseId, DB.collections.favorites, [
    Query.equal('userId', userId),
    Query.limit(100)
  ]);
  return res.documents;
}

export async function addFavorite(userId: string, foodId: string): Promise<FavoriteDoc> {
  return databases.createDocument<FavoriteDoc>(
    DB.databaseId,
    DB.collections.favorites,
    ID.unique(),
    { userId, foodId },
    [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
}

export async function removeFavorite(documentId: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, DB.collections.favorites, documentId);
}
