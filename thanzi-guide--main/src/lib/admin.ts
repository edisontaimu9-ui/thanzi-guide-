import { databases, DB, Query } from '@/lib/appwrite';
import type { ArticleDoc } from '@/lib/articles';
import type { CourseDoc } from '@/lib/courses';
import type { Models } from 'appwrite';

export interface FoodAdminDoc extends Models.Document {
  name: string;
  status: string;
}

// Draft = anything not yet published. Public list/detail queries only ever
// fetch status: 'published', so this is what content review works through.
export async function listDraftArticles(): Promise<ArticleDoc[]> {
  const res = await databases.listDocuments<ArticleDoc>(DB.databaseId, DB.collections.articles, [
    Query.equal('status', 'draft'),
    Query.limit(100)
  ]);
  return res.documents;
}

export async function listDraftFoods(): Promise<FoodAdminDoc[]> {
  const res = await databases.listDocuments<FoodAdminDoc>(DB.databaseId, DB.collections.foods, [
    Query.equal('status', 'draft'),
    Query.limit(100)
  ]);
  return res.documents;
}

export async function listDraftCourses(): Promise<CourseDoc[]> {
  const res = await databases.listDocuments<CourseDoc>(DB.databaseId, DB.collections.courses, [
    Query.equal('status', 'draft'),
    Query.limit(100)
  ]);
  return res.documents;
}

export async function publishArticle(id: string) {
  return databases.updateDocument(DB.databaseId, DB.collections.articles, id, { status: 'published' });
}

export async function publishFood(id: string) {
  return databases.updateDocument(DB.databaseId, DB.collections.foods, id, { status: 'published' });
}

export async function publishCourse(id: string) {
  return databases.updateDocument(DB.databaseId, DB.collections.courses, id, { status: 'published' });
}

export async function deleteArticle(id: string) {
  return databases.deleteDocument(DB.databaseId, DB.collections.articles, id);
}

export async function deleteFood(id: string) {
  return databases.deleteDocument(DB.databaseId, DB.collections.foods, id);
}

export async function deleteCourse(id: string) {
  return databases.deleteDocument(DB.databaseId, DB.collections.courses, id);
}
