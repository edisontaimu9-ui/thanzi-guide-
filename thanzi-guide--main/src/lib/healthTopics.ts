import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import type { ArticleDoc } from '@/lib/articles';

export interface HealthTopicDoc extends Models.Document {
  title: string;
  slug: string;
  body: string;
  order?: number;
  articleIds?: string[];
}

export interface HealthTopicViewDoc extends Models.Document {
  userId: string;
  topicSlug: string;
  viewedAt: string;
}

export async function listHealthTopics(): Promise<HealthTopicDoc[]> {
  const res = await databases.listDocuments<HealthTopicDoc>(DB.databaseId, DB.collections.healthTopics, [
    Query.equal('status', 'published'),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function listArticlesForTopic(topic: HealthTopicDoc): Promise<ArticleDoc[]> {
  if (!topic.articleIds || topic.articleIds.length === 0) return [];
  const res = await databases.listDocuments<ArticleDoc>(DB.databaseId, DB.collections.articles, [
    Query.equal('$id', topic.articleIds),
    Query.equal('status', 'published'),
    Query.limit(topic.articleIds.length)
  ]);
  return res.documents;
}

export async function listViewedTopicSlugs(userId: string): Promise<Set<string>> {
  const res = await databases.listDocuments<HealthTopicViewDoc>(
    DB.databaseId,
    DB.collections.healthTopicViews,
    [Query.equal('userId', userId), Query.limit(200)]
  );
  return new Set(res.documents.map((doc) => doc.topicSlug));
}

// Records that a user opened a topic. Safe to call repeatedly — the unique
// index on (userId, topicSlug) means a second call just fails quietly.
export async function recordTopicView(userId: string, topicSlug: string): Promise<void> {
  try {
    await databases.createDocument(
      DB.databaseId,
      DB.collections.healthTopicViews,
      ID.unique(),
      { userId, topicSlug, viewedAt: new Date().toISOString() },
      [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]
    );
  } catch {
    // Already viewed, or not signed in — either way, nothing to do.
  }
}
