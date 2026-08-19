import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface ExerciseLogDoc extends Models.Document {
  userId: string;
  activityName: string;
  durationMin: number;
  kcalBurned: number;
  loggedAt: string;
}

export async function logExercise(params: {
  userId: string;
  activityName: string;
  durationMin: number;
  kcalBurned: number;
  loggedAt?: Date;
}): Promise<ExerciseLogDoc> {
  const { userId, activityName, durationMin, kcalBurned, loggedAt = new Date() } = params;

  return databases.createDocument<ExerciseLogDoc>(
    DB.databaseId,
    DB.collections.exerciseLogs,
    ID.unique(),
    {
      userId,
      activityName,
      durationMin,
      kcalBurned,
      loggedAt: loggedAt.toISOString()
    },
    [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
}

export async function listExerciseLogsForDay(userId: string, day: Date): Promise<ExerciseLogDoc[]> {
  const res = await databases.listDocuments<ExerciseLogDoc>(DB.databaseId, DB.collections.exerciseLogs, [
    Query.equal('userId', userId),
    Query.orderDesc('loggedAt'),
    Query.limit(100)
  ]);

  const dayKey = day.toDateString();
  return res.documents.filter((log) => new Date(log.loggedAt).toDateString() === dayKey);
}

export async function deleteExerciseLog(documentId: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, DB.collections.exerciseLogs, documentId);
}
