import { storage, ID } from '@/lib/appwrite';

// Uploads a file to the given bucket and returns a public view URL. Used
// for provider photos (bucket "avatars") and can be reused for any other
// image field.
export async function uploadImage(bucketId: string, file: File): Promise<string> {
  const uploaded = await storage.createFile(bucketId, ID.unique(), file);
  return storage.getFileView(bucketId, uploaded.$id).toString();
}
