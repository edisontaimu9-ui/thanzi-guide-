import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { listMyReferences, uploadReference, deleteReference, UserReferenceDoc } from '@/lib/references';

const ACCEPTED = '.pdf,.docx,.txt,.csv,.jpg,.jpeg,.png,.webp';

const STATUS_LABEL: Record<UserReferenceDoc['status'], string> = {
  processing: 'Processing…',
  ready: 'Ready',
  failed: 'Failed',
  'no-content': 'Attached (no text content)'
};

export function ReferencesSection() {
  const { user } = useAuth();
  const [references, setReferences] = useState<UserReferenceDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [uploadingNames, setUploadingNames] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!user) return;
    setStatus('loading');
    try {
      const docs = await listMyReferences(user.$id);
      setReferences(docs);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !user) return;
      const files = Array.from(fileList);
      setUploadError(null);
      setUploadingNames(files.map((f) => f.name));

      for (const file of files) {
        try {
          await uploadReference(file, user.$id);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : `Couldn't upload "${file.name}".`);
        }
      }

      setUploadingNames([]);
      await load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user]
  );

  async function handleDelete(reference: UserReferenceDoc) {
    if (!confirm(`Remove "${reference.fileName}"?`)) return;
    setReferences((prev) => prev.filter((r) => r.$id !== reference.$id));
    try {
      await deleteReference(reference);
    } catch {
      await load();
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-brand-700 dark:text-sand-100">Further Reading &amp; References</h2>
      <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
        Upload documents you'd like included as reference material when the AI answers your questions.
        Supports PDF, DOCX, TXT, CSV, and images.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
          isDragging
            ? 'border-brand-500 bg-brand-100/40 dark:bg-ink-800'
            : 'border-brand-100 hover:border-brand-500 dark:border-ink-800'
        }`}
      >
        <p className="text-sm font-medium text-brand-700 dark:text-sand-100">
          Drag files here, or tap to browse
        </p>
        <p className="mt-1 text-xs text-brand-300 dark:text-brand-100">PDF, DOCX, TXT, CSV, JPG, PNG, WEBP — up to 15MB each</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {uploadingNames.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-brand-500 dark:text-brand-100">
          {uploadingNames.map((name) => (
            <li key={name}>Uploading "{name}"…</li>
          ))}
        </ul>
      )}

      {uploadError && (
        <p role="alert" className="mt-3 text-sm text-clay-500 dark:text-clay-400">
          {uploadError}
        </p>
      )}

      {status === 'loading' && <p className="mt-4 text-sm text-brand-500 dark:text-brand-100">Loading…</p>}
      {status === 'error' && (
        <p role="alert" className="mt-4 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load your files right now.
        </p>
      )}

      {status === 'idle' && references.length === 0 && uploadingNames.length === 0 && (
        <p className="mt-4 text-sm text-brand-500 dark:text-brand-100">No files uploaded yet.</p>
      )}

      {status === 'idle' && references.length > 0 && (
        <ul className="mt-4 space-y-2">
          {references.map((ref) => (
            <li
              key={ref.$id}
              className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-950"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-700 dark:text-sand-100">{ref.fileName}</p>
                <p
                  className={`text-xs ${
                    ref.status === 'failed'
                      ? 'text-clay-500 dark:text-clay-400'
                      : 'text-brand-300 dark:text-brand-100'
                  }`}
                >
                  {STATUS_LABEL[ref.status]}
                  {ref.status === 'failed' && ref.errorMessage ? ` — ${ref.errorMessage}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleDelete(ref)}
                className="shrink-0 text-sm font-medium text-clay-500 underline hover:text-clay-400 dark:text-clay-400"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
