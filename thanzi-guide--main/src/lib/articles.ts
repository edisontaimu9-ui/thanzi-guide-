import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface CategoryDoc extends Models.Document {
  name: string;
  slug: string;
  type: string;
  description?: string;
}

export interface ArticleDoc extends Models.Document {
  title: string;
  slug: string;
  summary?: string;
  body: string;
  categoryId?: string;
  tags?: string[];
  featuredImage?: string;
  authorId?: string;
  status: string;
  publishedAt?: string;
  updatedAt?: string;
  sources?: string[];
}

export async function listArticleCategories(): Promise<CategoryDoc[]> {
  const res = await databases.listDocuments<CategoryDoc>(DB.databaseId, DB.collections.categories, [
    Query.equal('type', 'article'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function listArticles(params: { categoryId?: string; search?: string } = {}): Promise<ArticleDoc[]> {
  const queries = [Query.equal('status', 'published'), Query.limit(50)];
  if (params.categoryId) queries.push(Query.equal('categoryId', params.categoryId));
  if (params.search) queries.push(Query.search('title', params.search));
  const res = await databases.listDocuments<ArticleDoc>(DB.databaseId, DB.collections.articles, queries);
  return res.documents;
}

export async function getArticleBySlug(slug: string): Promise<ArticleDoc | null> {
  const res = await databases.listDocuments<ArticleDoc>(DB.databaseId, DB.collections.articles, [
    Query.equal('slug', slug),
    Query.equal('status', 'published'),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}
