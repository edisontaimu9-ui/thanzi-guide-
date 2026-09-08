import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import type { ArticleDoc } from '@/lib/articles';

export interface KidsStageDoc extends Models.Document {
  title: string;
  slug: string;
  summary: string;
  body?: string;
  imageUrl?: string;
  articleIds?: string[];
  order?: number;
}

export async function listKidsStages(): Promise<KidsStageDoc[]> {
  const res = await databases.listDocuments<KidsStageDoc>(DB.databaseId, DB.collections.kidsStages, [
    Query.equal('status', 'published'),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function listArticlesForKidsStage(stage: KidsStageDoc): Promise<ArticleDoc[]> {
  if (!stage.articleIds || stage.articleIds.length === 0) return [];
  const res = await databases.listDocuments<ArticleDoc>(DB.databaseId, DB.collections.articles, [
    Query.equal('$id', stage.articleIds),
    Query.equal('status', 'published'),
    Query.limit(stage.articleIds.length)
  ]);
  return res.documents;
}
