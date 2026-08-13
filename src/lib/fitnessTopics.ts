import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import type { ArticleDoc } from '@/lib/articles';

export interface FitnessTopicDoc extends Models.Document {
  title: string;
  slug: string;
  body: string;
  order?: number;
  articleIds?: string[];
}

export async function listFitnessTopics(): Promise<FitnessTopicDoc[]> {
  const res = await databases.listDocuments<FitnessTopicDoc>(DB.databaseId, DB.collections.fitnessTopics, [
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function listArticlesForFitnessTopic(topic: FitnessTopicDoc): Promise<ArticleDoc[]> {
  if (!topic.articleIds || topic.articleIds.length === 0) return [];
  const res = await databases.listDocuments<ArticleDoc>(DB.databaseId, DB.collections.articles, [
    Query.equal('$id', topic.articleIds),
    Query.equal('status', 'published'),
    Query.limit(topic.articleIds.length)
  ]);
  return res.documents;
}
