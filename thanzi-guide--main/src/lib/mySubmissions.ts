// Local history of the packaged foods *this browser's logged-in user* has
// submitted to Chakudya. POST /packaged/submit is a public, unauthenticated
// Chakudya endpoint that doesn't take a userId, so there's no server-side
// "my submissions" list to fetch — this is purely a client-side receipt so
// a contributor can see what they've sent in, on this device.
//
// Storage key is scoped by Appwrite userId so switching accounts on the
// same device doesn't mix histories, and logging out doesn't lose history
// for whoever logs back in.

const STORAGE_PREFIX = 'thanzi:foodSubmissions:';
const MAX_ENTRIES = 50;

export interface MySubmissionEntry {
  barcode: string;
  productName: string;
  brand?: string;
  submittedAt: string; // ISO timestamp
  alreadyExisted: boolean;
}

function key(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function listMySubmissions(userId: string): MySubmissionEntry[] {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordMySubmission(userId: string, entry: MySubmissionEntry): void {
  try {
    const existing = listMySubmissions(userId);
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    localStorage.setItem(key(userId), JSON.stringify(next));
  } catch {
    // Storage full or unavailable (private browsing, etc.) — the submission
    // to Chakudya itself already succeeded, so silently skip the receipt
    // rather than surfacing an error for a non-critical local convenience.
  }
}
