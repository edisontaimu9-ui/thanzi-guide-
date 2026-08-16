import { databases, DB, Query } from '@/lib/appwrite';
import type { Models } from 'appwrite';

export interface PartnerInquiryDoc extends Models.Document {
  name: string;
  organization?: string;
  email: string;
  phone?: string;
  message: string;
}

export async function listPartnerInquiries(): Promise<PartnerInquiryDoc[]> {
  const res = await databases.listDocuments<PartnerInquiryDoc>(DB.databaseId, DB.collections.partnerInquiries, [
    Query.orderDesc('$createdAt'),
    Query.limit(100)
  ]);
  return res.documents;
}

export async function deletePartnerInquiry(id: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, DB.collections.partnerInquiries, id);
}
