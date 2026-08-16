import { storage, ID } from '@/lib/appwrite';

// Uploads a file to the given bucket and returns a public view URL. Used
// for provider photos (bucket "avatars") and can be reused for any other
// image field.
export async function uploadImage(bucketId: string, file: File): Promise<string> {
  const uploaded = await storage.createFile(bucketId, ID.unique(), file);
  return storage.getFileView(bucketId, uploaded.$id).toString();
}

// Uploads any file (PDF, DOCX, etc.) to the given bucket. Returns the raw
// storage file $id — callers store the id (not a URL) so they can later
// build a view link, a download link, or delete the file.
export async function uploadFile(bucketId: string, file: File): Promise<string> {
  const uploaded = await storage.createFile(bucketId, ID.unique(), file);
  return uploaded.$id;
}

// Opens/previews the file in the browser.
export function getFileViewUrl(bucketId: string, fileId: string): string {
  return storage.getFileView(bucketId, fileId).toString();
}

// Forces a download with the file's original name (Appwrite sets the
// Content-Disposition header for this endpoint).
export function getFileDownloadUrl(bucketId: string, fileId: string): string {
  return storage.getFileDownload(bucketId, fileId).toString();
}
