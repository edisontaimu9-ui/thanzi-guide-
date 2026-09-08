import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getLifeStagePage, listArticlesForLifeStagePage, LifeStagePageDoc } from '@/lib/lifeStagePages';
import type { ArticleDoc } from '@/lib/articles';

type Status = 'loading' | 'idle' | 'error';

interface LifeStagePageProps {
  slug: string;
  fallbackTitle: string;
}

export function LifeStagePage({ slug, fallbackTitle }: LifeStagePageProps) {
  useDocumentTitle(fallbackTitle);
  const [page, setPage] = useState<LifeStagePageDoc | null | undefined>(undefined);
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    getLifeStagePage(slug)
      .then(async (result) => {
        setPage(result);
        if (result) {
          const relatedArticles = await listArticlesForLifeStagePage(result);
          setArticles(relatedArticles);
        }
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

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
          <p className="text-sm text-clay-500 dark:text-clay-400">Couldn't load this page right now.</p>
        </div>
      )}

      {status === 'idle' && !page && (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-brand-700 dark:text-sand-100">This page is coming soon.</p>
        </div>
      )}

      {status === 'idle' && page && (
        <>
          <section className="bg-brand-500 px-6 py-12 text-white">
            <div className="mx-auto max-w-3xl">
              <h1 className="font-display text-3xl">{page.title}</h1>
              <p className="mt-4 max-w-xl text-white/90">{page.intro}</p>
            </div>
          </section>

          <div className="mx-auto max-w-3xl px-6 py-10">
            {articles.length === 0 ? (
              <p className="text-brand-500 dark:text-brand-100">More content for this page is on the way.</p>
            ) : (
              <ul className="space-y-4">
                {articles.map((article) => (
                  <li
                    key={article.$id}
                    className="rounded-lg border border-brand-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-950"
                  >
                    <Link
                      to={`/learn/${article.slug}`}
                      className="font-display text-lg text-brand-700 hover:text-brand-500 dark:text-sand-100 dark:hover:text-brand-100"
                    >
                      {article.title}
                    </Link>
                    {article.summary && (
                      <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">{article.summary}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
