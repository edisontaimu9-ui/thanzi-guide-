import { databases, storage, DB, BUCKETS, ID, Query, Permission, Role } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import { detectFileType, extractChunks } from '@/lib/referenceExtraction';

export interface UserReferenceDoc extends Models.Document {
  userId: string;
  fileName: string;
  fileType: string;
  storageFileId: string;
  status: 'processing' | 'ready' | 'failed' | 'no-content';
  chunkCount?: number;
  errorMessage?: string;
}

export async function listMyReferences(userId: string): Promise<UserReferenceDoc[]> {
  const res = await databases.listDocuments<UserReferenceDoc>(DB.databaseId, DB.collections.userReferences, [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(100)
  ]);
  return res.documents;
}

// Uploads the file, creates its metadata record, then extracts and stores
// text chunks. Runs the extraction inline (not queued) — fine for the file
// sizes this feature expects (under 15MB), but each step degrades
// gracefully: a failed extraction still leaves the file uploaded and
// browsable, just marked accordingly instead of losing the upload.
export async function uploadReference(file: File, userId: string): Promise<UserReferenceDoc> {
  const type = detectFileType(file);
  if (!type) {
    throw new Error('Unsupported file type. Use PDF, DOCX, TXT, CSV, or an image.');
  }

  const uploadedFile = await storage.createFile(BUCKETS.referenceFiles, ID.unique(), file, [
    Permission.read(Role.user(userId)),
    Permission.delete(Role.user(userId))
  ]);

  let reference = await databases.createDocument<UserReferenceDoc>(
    DB.databaseId,
    DB.collections.userReferences,
    ID.unique(),
    { userId, fileName: file.name, fileType: type, storageFileId: uploadedFile.$id, status: 'processing' },
    [Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]
  );

  try {
    const chunks = await extractChunks(file, type);

    if (chunks === null) {
      reference = await databases.updateDocument<UserReferenceDoc>(
        DB.databaseId,
        DB.collections.userReferences,
        reference.$id,
        { status: 'no-content' }
      );
      return reference;
    }

    await Promise.all(
      chunks.map((chunk, index) =>
        databases.createDocument(
          DB.databaseId,
          DB.collections.referenceChunks,
          ID.unique(),
          {
            referenceId: reference.$id,
            userId,
            chunkIndex: index,
            pageNumber: chunk.pageNumber,
            sectionLabel: chunk.sectionLabel,
            text: chunk.text
          },
          [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]
        )
      )
    );

    reference = await databases.updateDocument<UserReferenceDoc>(
      DB.databaseId,
      DB.collections.userReferences,
      reference.$id,
      { status: 'ready', chunkCount: chunks.length }
    );
  } catch (err) {
    reference = await databases.updateDocument<UserReferenceDoc>(
      DB.databaseId,
      DB.collections.userReferences,
      reference.$id,
      { status: 'failed', errorMessage: err instanceof Error ? err.message : 'Extraction failed.' }
    );
  }

  return reference;
}

export async function deleteReference(reference: UserReferenceDoc): Promise<void> {
  try {
    const chunks = await databases.listDocuments(DB.databaseId, DB.collections.referenceChunks, [
      Query.equal('referenceId', reference.$id),
      Query.limit(200)
    ]);
    await Promise.all(
      chunks.documents.map((chunk) =>
        databases.deleteDocument(DB.databaseId, DB.collections.referenceChunks, chunk.$id)
      )
    );
  } catch {
    // ignore
  }
  try {
    await storage.deleteFile(BUCKETS.referenceFiles, reference.storageFileId);
  } catch {
    // ignore
  }
  await databases.deleteDocument(DB.databaseId, DB.collections.userReferences, reference.$id);
}
