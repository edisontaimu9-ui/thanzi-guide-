import { useEffect, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listPublishedReferences, ReferenceDoc } from '@/lib/publicReferences';
import { getFileViewUrl, getFileDownloadUrl } from '@/lib/storage';
import { BUCKETS } from '@/lib/appwrite';
import { LoadingRunner } from '@/components/LoadingRunner';

export function References() {
  useDocumentTitle('References');
  const [references, setReferences] = useState<ReferenceDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    listPublishedReferences()
      .then((docs) => {
        setReferences(docs);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">References</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Source material and documents behind the guidance on Thanzi Guide.
      </p>

      {status === 'loading' && <LoadingRunner className="mt-8" />}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load references right now.
        </p>
      )}
      {status === 'idle' && references.length === 0 && (
        <p className="mt-8 text-brand-500 dark:text-brand-100">No references published yet.</p>
      )}

      {status === 'idle' && references.length > 0 && (
        <ul className="mt-8 space-y-3">
          {references.map((ref) => (
            <li
              key={ref.$id}
              className="rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
            >
              <p className="font-medium text-brand-700 dark:text-sand-100">{ref.title}</p>
              {(ref.publisher || ref.year) && (
                <p className="mt-0.5 text-sm text-brand-500 dark:text-brand-100">
                  {[ref.publisher, ref.year].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {ref.fileId && (
                  <>
                    <a
                      href={getFileViewUrl(BUCKETS.media, ref.fileId)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-brand-500 underline hover:text-brand-700 dark:text-brand-100"
                    >
                      View{ref.fileName ? ` "${ref.fileName}"` : ' file'}
                    </a>
                    <a
                      href={getFileDownloadUrl(BUCKETS.media, ref.fileId)}
                      className="font-medium text-brand-500 underline hover:text-brand-700 dark:text-brand-100"
                    >
                      Download
                    </a>
                  </>
                )}
                {ref.url && (
                  <a
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-500 underline hover:text-brand-700 dark:text-brand-100"
                  >
                    Visit source
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
