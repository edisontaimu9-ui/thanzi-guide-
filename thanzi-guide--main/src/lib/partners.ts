import { databases, DB, ID } from '@/lib/appwrite';

export interface PartnerInquiryInput {
  name: string;
  organization?: string;
  email: string;
  phone?: string;
  message: string;
}

// Write-only from the client's perspective — the partner_inquiries
// collection grants create("any") but read only to label:admin, so
// submissions are private until someone reviews them in the Appwrite
// console (or a future admin screen).
export async function submitPartnerInquiry(input: PartnerInquiryInput): Promise<void> {
  await databases.createDocument(DB.databaseId, DB.collections.partnerInquiries, ID.unique(), input);
}
