import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import type { ChakudyaFood } from '@/lib/chakudya';

export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export interface MealLogDoc extends Models.Document {
  userId: string;
  foodId: string;
  foodName: string;
  mealType: MealType;
  kcal?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  loggedAt: string;
}

// Nutrient values are copied onto the log at the time it's added, not
// looked up live from the food each time — so a log stays accurate even
// if the underlying food entry is edited or removed later.
export async function logMeal(params: {
  userId: string;
  food: ChakudyaFood;
  mealType: MealType;
  loggedAt?: Date;
}): Promise<MealLogDoc> {
  const { userId, food, mealType, loggedAt = new Date() } = params;

  return databases.createDocument<MealLogDoc>(
    DB.databaseId,
    DB.collections.mealLogs,
    ID.unique(),
    {
      userId,
      foodId: String(food.id),
      foodName: food.food_name,
      mealType,
      kcal: food.kcal,
      proteinG: food.protein_g,
      carbsG: food.carbs_g,
      fatG: food.fat_g,
      loggedAt: loggedAt.toISOString()
    },
    [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
}

// Fetches a bounded window of recent logs and filters to `day` client-side
// rather than a date-range query, since a single person's daily log count
// is small and this avoids needing a second index for range queries.
export async function listMealLogsForDay(userId: string, day: Date): Promise<MealLogDoc[]> {
  const res = await databases.listDocuments<MealLogDoc>(DB.databaseId, DB.collections.mealLogs, [
    Query.equal('userId', userId),
    Query.orderDesc('loggedAt'),
    Query.limit(100)
  ]);

  const dayKey = day.toDateString();
  return res.documents.filter((log) => new Date(log.loggedAt).toDateString() === dayKey);
}

export async function deleteMealLog(documentId: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, DB.collections.mealLogs, documentId);
}
