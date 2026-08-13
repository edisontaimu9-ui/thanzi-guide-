import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listFitnessTopics, listArticlesForFitnessTopic, FitnessTopicDoc } from '@/lib/fitnessTopics';
import type { ArticleDoc } from '@/lib/articles';

type Status = 'loading' | 'idle' | 'error';

export function Fitness() {
  useDocumentTitle('Fitness');

  const [topics, setTopics] = useState<FitnessTopicDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [articlesByTopic, setArticlesByTopic] = useState<Record<string, ArticleDoc[]>>({});
  const [loadingArticlesFor, setLoadingArticlesFor] = useState<string | null>(null);

  useEffect(() => {
    listFitnessTopics()
      .then((results) => {
        setTopics(results);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  async function handleToggle(index: number, topic: FitnessTopicDoc) {
    const opening = openIndex !== index;
    setOpenIndex(opening ? index : null);
    if (!opening || articlesByTopic[topic.$id]) return;

    setLoadingArticlesFor(topic.$id);
    try {
      const articles = await listArticlesForFitnessTopic(topic);
      setArticlesByTopic((prev) => ({ ...prev, [topic.$id]: articles }));
    } finally {
      setLoadingArticlesFor(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Fitness</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Whether you're competing in a sport or working out at home, how you fuel your body affects
        performance. Learn how eating well supports exercise and recovery, and get ideas for
        building regular activity into your routine.
      </p>

      {status === 'loading' && <TopicListSkeleton />}

      {status === 'error' && (
        <div role="alert" className="mt-8 rounded-md border border-clay-400 bg-clay-400/10 p-4 text-clay-500 dark:text-clay-400">
          <p className="font-medium">Couldn't load fitness topics</p>
          <p className="mt-1 text-sm">Check your connection and try again.</p>
        </div>
      )}

      {status === 'idle' && topics.length === 0 && (
        <div className="mt-8 rounded-md border border-brand-100 p-8 text-center text-brand-500 dark:text-brand-100 dark:border-ink-800">
          <p>No fitness topics yet. Check back soon.</p>
        </div>
      )}

      {status === 'idle' && topics.length > 0 && (
        <section className="mt-10 rounded-lg border border-brand-100 bg-sand-50 p-6 dark:border-ink-800 dark:bg-ink-900/40">
          <ul className="divide-y divide-brand-100 dark:divide-ink-800">
            {topics.map((topic, index) => {
              const isOpen = openIndex === index;
              const relatedArticles = articlesByTopic[topic.$id];

              return (
                <li key={topic.$id}>
                  <button
                    type="button"
                    onClick={() => handleToggle(index, topic)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="font-semibold uppercase tracking-wide text-brand-700 dark:text-sand-100">
                      {topic.title}
                    </span>
                    <svg
                      className={`h-5 w-5 flex-shrink-0 text-brand-500 transition-transform dark:text-brand-100 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="pb-4">
                      <p className="text-sm text-brand-500 dark:text-brand-100">{topic.body}</p>

                      {loadingArticlesFor === topic.$id && (
                        <p className="mt-3 text-xs text-brand-300 dark:text-brand-100">Loading related articles…</p>
                      )}

                      {relatedArticles && relatedArticles.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {relatedArticles.map((article) => (
                            <li key={article.$id}>
                              <Link
                                to={`/learn/${article.slug}`}
                                className="text-sm font-medium text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white"
                              >
                                {article.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}

                      <Link
                        to={`/fitness/${topic.slug}`}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white"
                      >
                        View {topic.title}
                        <span aria-hidden="true">›</span>
                      </Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

function TopicListSkeleton() {
  return (
    <div className="mt-10 animate-pulse rounded-lg border border-brand-100 bg-sand-50 p-6 dark:border-ink-800 dark:bg-ink-900/40" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="border-b border-brand-100 py-4 last:border-b-0 dark:border-ink-800">
          <div className="h-4 w-1/3 rounded bg-brand-100 dark:bg-ink-900" />
        </div>
      ))}
    </div>
  );
}
