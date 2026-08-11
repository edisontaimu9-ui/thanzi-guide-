import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProviders, ProviderDoc } from '@/lib/providers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Care() {
  useDocumentTitle('Find a dietitian or doctor');
  const [providers, setProviders] = useState<ProviderDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    listProviders()
      .then((results) => {
        setProviders(results);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">Find a dietitian or doctor</h1>
      <p className="mt-2 max-w-xl text-brand-500 dark:text-brand-100">
        Book time with a real professional for guidance Thanzi Guide's articles and tools can't give you —
        this is an estimate-and-education platform, not a substitute for individual medical advice.
      </p>

      {status === 'loading' && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-brand-700 dark:bg-brand-900" />
          ))}
        </div>
      )}

      {status === 'error' && (
        <p className="mt-8 text-sm text-clay-500 dark:text-clay-400">Couldn't load providers right now.</p>
      )}

      {status === 'idle' && providers.length === 0 && (
        <div className="mt-8 rounded-lg border border-brand-100 p-8 text-center text-brand-500 dark:text-brand-100 dark:border-brand-700">
          <p>No providers listed yet.</p>
        </div>
      )}

      {status === 'idle' && providers.length > 0 && (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {providers.map((provider) => (
            <Link
              key={provider.$id}
              to={`/care/${provider.$id}`}
              className="rounded-lg border border-brand-100 bg-white p-5 transition hover:border-brand-500 dark:border-brand-700 dark:bg-brand-900"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-lg text-white">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-brand-700 dark:text-sand-50">{provider.name}</p>
                  <p className="text-xs text-brand-300 dark:text-brand-100">{provider.title}</p>
                </div>
              </div>
              {provider.specialty && (
                <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">{provider.specialty}</p>
              )}
              {provider.location && (
                <p className="mt-1 text-xs text-brand-300 dark:text-brand-100">{provider.location}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
