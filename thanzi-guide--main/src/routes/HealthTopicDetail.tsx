import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listHealthTopics, HealthTopicDoc } from '@/lib/healthTopics';
import { listSubtopicsForTopic, HealthSubtopicDoc } from '@/lib/healthSubtopics';

type Status = 'loading' | 'idle' | 'error';

export function HealthTopicDetail() {
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const [topic, setTopic] = useState<HealthTopicDoc | null | undefined>(undefined);
  const [subtopics, setSubtopics] = useState<HealthSubtopicDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  useDocumentTitle(topic?.title);

  useEffect(() => {
    if (!topicSlug) return;
    setStatus('loading');
    Promise.all([listHealthTopics(), listSubtopicsForTopic(topicSlug)])
      .then(([topics, subs]) => {
        setTopic(topics.find((t) => t.slug === topicSlug) ?? null);
        setSubtopics(subs);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [topicSlug]);

  return (
    <main>
      {status === 'loading' && (
        <div className="mx-auto max-w-3xl animate-pulse px-6 py-12" aria-hidden="true">
          <div className="h-8 w-1/2 rounded bg-brand-100 dark:bg-ink-900" />
          <div className="mt-4 h-4 w-full rounded bg-brand-100 dark:bg-ink-900" />
        </div>
      )}

      {status === 'error' && (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-sm text-clay-500 dark:text-clay-400">Couldn't load this topic right now.</p>
        </div>
      )}

      {status === 'idle' && !topic && (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link to="/health" className="text-sm text-brand-500 underline dark:text-brand-100">
            ← Back to Health
          </Link>
          <p className="mt-6 text-brand-700 dark:text-sand-100">Topic not found.</p>
        </div>
      )}

      {status === 'idle' && topic && (
        <>
          <section className="bg-brand-500 px-6 py-12 text-white">
            <div className="mx-auto max-w-3xl">
              <Link to="/health" className="text-sm text-white/80 underline hover:text-white">
                ← Health
              </Link>
              <h1 className="mt-4 font-display text-3xl">{topic.title}</h1>
              <p className="mt-4 max-w-xl text-white/90">{topic.body}</p>
            </div>
          </section>

          {subtopics.length > 0 && (
            <div className="mx-auto max-w-3xl px-6 py-10">
              <ul className="grid gap-6 sm:grid-cols-2">
                {subtopics.map((sub) => (
                  <li
                    key={sub.$id}
                    className="overflow-hidden rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950"
                  >
                    {sub.imageUrl ? (
                      <img src={sub.imageUrl} alt="" className="h-40 w-full object-cover" />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-sand-100 text-2xl font-display text-brand-300 dark:bg-ink-900 dark:text-brand-100">
                        {sub.title.charAt(0)}
                      </div>
                    )}
                    <div className="p-5">
                      <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">{sub.title}</h2>
                      <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">{sub.summary}</p>
                      <Link
                        to={`/health/${topic.slug}/${sub.slug}`}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white"
                      >
                        Learn About
                        <span aria-hidden="true">›</span>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {subtopics.length === 0 && (
            <div className="mx-auto max-w-3xl px-6 py-10">
              <p className="text-brand-500 dark:text-brand-100">More on this topic is on the way.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
