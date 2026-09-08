import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface ReferenceDoc extends Models.Document {
  title: string;
  category?: string;
  url?: string;
  fileId?: string;
  fileName?: string;
  publisher?: string;
  year?: number;
  status: string;
}

// Public, read-only list of published references — anyone can call this,
// no admin check needed (the "references" collection grants read("any")).
export async function listPublishedReferences(): Promise<ReferenceDoc[]> {
  const res = await databases.listDocuments<ReferenceDoc>(DB.databaseId, DB.collections.references, [
    Query.equal('status', 'published'),
    Query.orderDesc('$createdAt'),
    Query.limit(200)
  ]);
  return res.documents;
}
