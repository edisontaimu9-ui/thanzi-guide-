import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getSubtopicBySlug, HealthSubtopicDoc } from '@/lib/healthSubtopics';

type Status = 'loading' | 'idle' | 'error';

export function HealthSubtopicDetail() {
  const { topicSlug, subtopicSlug } = useParams<{ topicSlug: string; subtopicSlug: string }>();
  const [subtopic, setSubtopic] = useState<HealthSubtopicDoc | null | undefined>(undefined);
  const [status, setStatus] = useState<Status>('loading');
  useDocumentTitle(subtopic?.title);

  useEffect(() => {
    if (!subtopicSlug) return;
    setStatus('loading');
    getSubtopicBySlug(subtopicSlug)
      .then((result) => {
        setSubtopic(result);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [subtopicSlug]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to={`/health/${topicSlug}`} className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Back
      </Link>

      {status === 'loading' && (
        <div className="mt-6 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-8 w-1/2 rounded bg-brand-100 dark:bg-ink-900" />
          <div className="h-4 w-full rounded bg-brand-100 dark:bg-ink-900" />
        </div>
      )}

      {status === 'error' && (
        <p className="mt-6 text-sm text-clay-500 dark:text-clay-400">Couldn't load this right now.</p>
      )}

      {status === 'idle' && !subtopic && (
        <p className="mt-6 text-brand-700 dark:text-sand-100">Not found.</p>
      )}

      {status === 'idle' && subtopic && (
        <article>
          {subtopic.imageUrl && (
            <img src={subtopic.imageUrl} alt="" className="mt-6 h-56 w-full rounded-lg object-cover" />
          )}
          <h1 className="mt-6 font-display text-3xl text-brand-700 dark:text-sand-100">{subtopic.title}</h1>
          <p className="mt-3 text-brand-500 dark:text-brand-100">{subtopic.summary}</p>

          {subtopic.body && (
            <div className="prose prose-brand mt-6 max-w-none space-y-4 text-brand-900 dark:text-sand-50">
              {subtopic.body.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}

          {subtopic.articleSlug && (
            <Link
              to={`/learn/${subtopic.articleSlug}`}
              className="mt-6 inline-block rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Read the full article
            </Link>
          )}
        </article>
      )}
    </main>
  );
}
