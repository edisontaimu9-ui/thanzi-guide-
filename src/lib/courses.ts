import { databases, DB, Query, ID, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface CourseDoc extends Models.Document {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  status: string;
  order?: number;
}

export interface LessonDoc extends Models.Document {
  courseId: string;
  title: string;
  slug: string;
  content: string;
  order?: number;
  status: string;
}

export interface QuizDoc extends Models.Document {
  lessonId: string;
  title?: string;
}

export interface QuestionDoc extends Models.Document {
  quizId: string;
  text: string;
  order?: number;
}

export interface AnswerDoc extends Models.Document {
  questionId: string;
  text: string;
  isCorrect: boolean;
  order?: number;
}

export interface ProgressDoc extends Models.Document {
  userId: string;
  courseId?: string;
  lessonId?: string;
  completed: boolean;
  completedAt?: string;
}

export async function listCourses(): Promise<CourseDoc[]> {
  const res = await databases.listDocuments<CourseDoc>(DB.databaseId, DB.collections.courses, [
    Query.equal('status', 'published'),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function getCourseBySlug(slug: string): Promise<CourseDoc | null> {
  const res = await databases.listDocuments<CourseDoc>(DB.databaseId, DB.collections.courses, [
    Query.equal('slug', slug),
    Query.equal('status', 'published'),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}

export async function listLessons(courseId: string): Promise<LessonDoc[]> {
  const res = await databases.listDocuments<LessonDoc>(DB.databaseId, DB.collections.lessons, [
    Query.equal('courseId', courseId),
    Query.equal('status', 'published'),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function getLessonBySlug(courseId: string, slug: string): Promise<LessonDoc | null> {
  const res = await databases.listDocuments<LessonDoc>(DB.databaseId, DB.collections.lessons, [
    Query.equal('courseId', courseId),
    Query.equal('slug', slug),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}

export async function getQuizForLesson(lessonId: string): Promise<QuizDoc | null> {
  const res = await databases.listDocuments<QuizDoc>(DB.databaseId, DB.collections.quizzes, [
    Query.equal('lessonId', lessonId),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}

export async function listQuestions(quizId: string): Promise<QuestionDoc[]> {
  const res = await databases.listDocuments<QuestionDoc>(DB.databaseId, DB.collections.questions, [
    Query.equal('quizId', quizId),
    Query.orderAsc('order'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function listAnswers(questionId: string): Promise<AnswerDoc[]> {
  const res = await databases.listDocuments<AnswerDoc>(DB.databaseId, DB.collections.answers, [
    Query.equal('questionId', questionId),
    Query.orderAsc('order'),
    Query.limit(10)
  ]);
  return res.documents;
}

export async function listUserProgress(userId: string, courseId: string): Promise<ProgressDoc[]> {
  const res = await databases.listDocuments<ProgressDoc>(DB.databaseId, DB.collections.userProgress, [
    Query.equal('userId', userId),
    Query.equal('courseId', courseId),
    Query.limit(100)
  ]);
  return res.documents;
}

export async function markLessonComplete(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<ProgressDoc> {
  return databases.createDocument<ProgressDoc>(
    DB.databaseId,
    DB.collections.userProgress,
    ID.unique(),
    { userId, courseId, lessonId, completed: true, completedAt: new Date().toISOString() },
    [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
}
