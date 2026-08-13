import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import type { ArticleDoc } from '@/lib/articles';

export interface LifeStagePageDoc extends Models.Document {
  title: string;
  slug: string;
  intro: string;
  imageUrl?: string;
  articleIds?: string[];
}

export async function getLifeStagePage(slug: string): Promise<LifeStagePageDoc | null> {
  const res = await databases.listDocuments<LifeStagePageDoc>(DB.databaseId, DB.collections.lifeStagePages, [
    Query.equal('slug', slug),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}

export async function listArticlesForLifeStagePage(page: LifeStagePageDoc): Promise<ArticleDoc[]> {
  if (!page.articleIds || page.articleIds.length === 0) return [];
  const res = await databases.listDocuments<ArticleDoc>(DB.databaseId, DB.collections.articles, [
    Query.equal('$id', page.articleIds),
    Query.equal('status', 'published'),
    Query.limit(page.articleIds.length)
  ]);
  return res.documents;
}
