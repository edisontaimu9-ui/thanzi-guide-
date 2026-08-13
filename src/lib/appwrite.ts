import { Client, Account, Databases, Storage, Teams, ID, Query, Permission, Role } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;

if (!endpoint || !projectId) {
  // eslint-disable-next-line no-console
  console.warn(
    '[appwrite] Missing VITE_APPWRITE_ENDPOINT or VITE_APPWRITE_PROJECT_ID. ' +
      'Copy .env.example to .env and fill in your Appwrite project details.'
  );
}

export const client = new Client();

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const teams = new Teams(client);

export { ID, Query, Permission, Role };

// Central place for database/collection IDs so the rest of the app never
// hardcodes strings. Values are read from env so dev/staging/prod can point
// at different Appwrite projects without code changes.
export const DB = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID as string,
  collections: {
    profiles: 'profiles',
    foods: 'foods',
    articles: 'articles',
    categories: 'categories',
    courses: 'courses',
    lessons: 'lessons',
    quizzes: 'quizzes',
    questions: 'questions',
    answers: 'answers',
    userProgress: 'user_progress',
    bookmarks: 'bookmarks',
    favorites: 'favorites',
    references: 'references',
    providers: 'providers',
    appointmentSlots: 'appointment_slots',
    appointments: 'appointments',
    partnerInquiries: 'partner_inquiries',
    notifications: 'notifications',
    pushSubscriptions: 'push_subscriptions',
    healthTopics: 'health_topics',
    healthTopicViews: 'health_topic_views'
  }
} as const;

export const BUCKETS = {
  foodImages: 'food_images',
  articleImages: 'article_images',
  avatars: 'avatars'
} as const;

// App roles — mirrored on each profile document's `role` attribute, and
// also worth setting as an Appwrite user label server-side so collection
// permissions can check `label:admin` etc. directly.
export const ROLES = {
  USER: 'USER',
  EDITOR: 'EDITOR',
  NUTRITION_EXPERT: 'NUTRITION_EXPERT',
  ADMIN: 'ADMIN'
} as const;

export type Role_ = (typeof ROLES)[keyof typeof ROLES];
