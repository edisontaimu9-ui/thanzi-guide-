import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface RecipeCategoryDoc extends Models.Document {
  title: string;
  slug: string;
  summary: string;
  imageUrl?: string;
  order?: number;
}

export interface RecipeDoc extends Models.Document {
  title: string;
  slug: string;
  categorySlug: string;
  summary: string;
  imageUrl?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  ingredients?: string[];
  steps?: string[];
  articleSlug?: string;
  order?: number;
}

export async function listRecipeCategories(): Promise<RecipeCategoryDoc[]> {
  const res = await databases.listDocuments<RecipeCategoryDoc>(DB.databaseId, DB.collections.recipeCategories, [
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function listRecipesForCategory(categorySlug: string): Promise<RecipeDoc[]> {
  const res = await databases.listDocuments<RecipeDoc>(DB.databaseId, DB.collections.recipes, [
    Query.equal('categorySlug', categorySlug),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function getRecipeBySlug(slug: string): Promise<RecipeDoc | null> {
  const res = await databases.listDocuments<RecipeDoc>(DB.databaseId, DB.collections.recipes, [
    Query.equal('slug', slug),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}
