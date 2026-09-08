import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listKidsStages, KidsStageDoc } from '@/lib/kidsStages';

type Status = 'loading' | 'idle' | 'error';

export function Kids() {
  useDocumentTitle('For Kids');
  const [stages, setStages] = useState<KidsStageDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    listKidsStages()
      .then((results) => {
        setStages(results);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">For Kids</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        A child's nutrition needs change quickly as they grow. Browse by age and stage to find
        guidance suited to where your child is right now.
      </p>

      {status === 'loading' && <CardGridSkeleton />}

      {status === 'error' && (
        <div role="alert" className="mt-8 rounded-md border border-clay-400 bg-clay-400/10 p-4 text-clay-500 dark:text-clay-400">
          <p className="font-medium">Couldn't load this page</p>
          <p className="mt-1 text-sm">Check your connection and try again.</p>
        </div>
      )}

      {status === 'idle' && stages.length === 0 && (
        <div className="mt-8 rounded-md border border-brand-100 p-8 text-center text-brand-500 dark:text-brand-100 dark:border-ink-800">
          <p>Age-stage guidance is coming soon.</p>
        </div>
      )}

      {status === 'idle' && stages.length > 0 && (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {stages.map((stage) => (
            <li
              key={stage.$id}
              className="overflow-hidden rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950"
            >
              {stage.imageUrl ? (
                <img src={stage.imageUrl} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center bg-sand-100 text-2xl font-display text-brand-300 dark:bg-ink-900 dark:text-brand-100">
                  {stage.title.charAt(0)}
                </div>
              )}
              <div className="p-5">
                <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">{stage.title}</h2>
                <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">{stage.summary}</p>
                <Link
                  to={`/kids/${stage.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white"
                >
                  Learn About
                  <span aria-hidden="true">›</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function CardGridSkeleton() {
  return (
    <div className="mt-10 grid animate-pulse gap-6 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-56 rounded-lg bg-brand-100 dark:bg-ink-900" />
      ))}
    </div>
  );
}
