import { databases, DB, ID, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import type { ContentSchema } from '@/lib/contentSchemas';

export type GenericDoc = Models.Document & Record<string, unknown>;

export async function listAllContent(schema: ContentSchema): Promise<GenericDoc[]> {
  const res = await databases.listDocuments<GenericDoc>(DB.databaseId, schema.collectionId, [
    Query.limit(200),
    Query.orderDesc('$createdAt')
  ]);
  return res.documents;
}

export async function getContentById(schema: ContentSchema, id: string): Promise<GenericDoc> {
  return databases.getDocument<GenericDoc>(DB.databaseId, schema.collectionId, id);
}

export async function createContent(schema: ContentSchema, data: Record<string, unknown>): Promise<GenericDoc> {
  return databases.createDocument<GenericDoc>(DB.databaseId, schema.collectionId, ID.unique(), {
    ...data,
    status: 'draft'
  });
}

export async function updateContent(
  schema: ContentSchema,
  id: string,
  data: Record<string, unknown>
): Promise<GenericDoc> {
  return databases.updateDocument<GenericDoc>(DB.databaseId, schema.collectionId, id, data);
}

export async function publishContent(schema: ContentSchema, id: string): Promise<GenericDoc> {
  return databases.updateDocument<GenericDoc>(DB.databaseId, schema.collectionId, id, { status: 'published' });
}

export async function unpublishContent(schema: ContentSchema, id: string): Promise<GenericDoc> {
  return databases.updateDocument<GenericDoc>(DB.databaseId, schema.collectionId, id, { status: 'draft' });
}

export async function deleteContent(schema: ContentSchema, id: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, schema.collectionId, id);
}
