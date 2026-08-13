import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface FitnessSubtopicDoc extends Models.Document {
  title: string;
  slug: string;
  parentSlug: string;
  summary: string;
  body?: string;
  imageUrl?: string;
  articleSlug?: string;
  order?: number;
}

export async function listSubtopicsForFitnessTopic(parentSlug: string): Promise<FitnessSubtopicDoc[]> {
  const res = await databases.listDocuments<FitnessSubtopicDoc>(DB.databaseId, DB.collections.fitnessSubtopics, [
    Query.equal('parentSlug', parentSlug),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function getFitnessSubtopicBySlug(slug: string): Promise<FitnessSubtopicDoc | null> {
  const res = await databases.listDocuments<FitnessSubtopicDoc>(DB.databaseId, DB.collections.fitnessSubtopics, [
    Query.equal('slug', slug),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}
