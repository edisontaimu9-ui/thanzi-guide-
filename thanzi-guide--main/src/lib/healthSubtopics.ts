import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface HealthSubtopicDoc extends Models.Document {
  title: string;
  slug: string;
  parentSlug: string;
  summary: string;
  body?: string;
  imageUrl?: string;
  articleSlug?: string;
  order?: number;
}

export async function listSubtopicsForTopic(parentSlug: string): Promise<HealthSubtopicDoc[]> {
  const res = await databases.listDocuments<HealthSubtopicDoc>(DB.databaseId, DB.collections.healthSubtopics, [
    Query.equal('parentSlug', parentSlug),
    Query.equal('status', 'published'),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function getSubtopicBySlug(slug: string): Promise<HealthSubtopicDoc | null> {
  const res = await databases.listDocuments<HealthSubtopicDoc>(DB.databaseId, DB.collections.healthSubtopics, [
    Query.equal('slug', slug),
    Query.equal('status', 'published'),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}
