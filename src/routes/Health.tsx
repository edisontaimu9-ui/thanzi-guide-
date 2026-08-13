import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  listHealthTopics,
  listArticlesForTopic,
  listViewedTopicSlugs,
  recordTopicView,
  HealthTopicDoc
} from '@/lib/healthTopics';
import type { ArticleDoc } from '@/lib/articles';

type Status = 'loading' | 'idle' | 'error';

export function Health() {
  useDocumentTitle('Health');
  const { user } = useAuth();

  const [topics, setTopics] = useState<HealthTopicDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [viewedSlugs, setViewedSlugs] = useState<Set<string>>(new Set());
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [articlesByTopic, setArticlesByTopic] = useState<Record<string, ArticleDoc[]>>({});
  const [loadingArticlesFor, setLoadingArticlesFor] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setStatus('loading');
      try {
        const [topicResults, viewed] = await Promise.all([
          listHealthTopics(),
          user ? listViewedTopicSlugs(user.$id) : Promise.resolve(new Set<string>())
        ]);
        setTopics(topicResults);
        setViewedSlugs(viewed);
        setStatus('idle');
      } catch {
        setStatus('error');
      }
    }
    load();
  }, [user]);

  async function handleToggle(index: number, topic: HealthTopicDoc) {
    const opening = openIndex !== index;
    setOpenIndex(opening ? index : null);
    if (!opening) return;

    if (!articlesByTopic[topic.$id]) {
      setLoadingArticlesFor(topic.$id);
      try {
        const articles = await listArticlesForTopic(topic);
        setArticlesByTopic((prev) => ({ ...prev, [topic.$id]: articles }));
      } finally {
        setLoadingArticlesFor(null);
      }
    }

    if (user && !viewedSlugs.has(topic.slug)) {
      setViewedSlugs((prev) => new Set(prev).add(topic.slug));
      recordTopicView(user.$id, topic.slug).catch(() => {});
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Health</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Dietary needs change at every stage of life. A nutritious, balanced eating plan helps you
        get the nutrients you need, whether you're maintaining good health or managing a health
        condition.
      </p>

      {status === 'loading' && <TopicListSkeleton />}

      {status === 'error' && (
        <div role="alert" className="mt-8 rounded-md border border-clay-400 bg-clay-400/10 p-4 text-clay-500 dark:text-clay-400">
          <p className="font-medium">Couldn't load health topics</p>
          <p className="mt-1 text-sm">Check your connection and try again.</p>
        </div>
      )}

      {status === 'idle' && topics.length === 0 && (
        <div className="mt-8 rounded-md border border-brand-100 p-8 text-center text-brand-500 dark:text-brand-100 dark:border-ink-800">
          <p>No health topics yet. Check back soon.</p>
        </div>
      )}

      {status === 'idle' && topics.length > 0 && (
        <section className="mt-10 rounded-lg border border-brand-100 bg-sand-50 p-6 dark:border-ink-800 dark:bg-ink-900/40">
          <ul className="divide-y divide-brand-100 dark:divide-ink-800">
            {topics.map((topic, index) => {
              const isOpen = openIndex === index;
              const isViewed = viewedSlugs.has(topic.slug);
              const relatedArticles = articlesByTopic[topic.$id];

              return (
                <li key={topic.$id}>
                  <button
                    type="button"
                    onClick={() => handleToggle(index, topic)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  >
                    <span className="flex items-center gap-2 font-semibold uppercase tracking-wide text-brand-700 dark:text-sand-100">
                      {topic.title}
                      {isViewed && (
                        <span
                          title="You've read this"
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] text-white"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      )}
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
                        to={`/health/${topic.slug}`}
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
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border-b border-brand-100 py-4 last:border-b-0 dark:border-ink-800">
          <div className="h-4 w-1/3 rounded bg-brand-100 dark:bg-ink-900" />
        </div>
      ))}
    </div>
  );
}
