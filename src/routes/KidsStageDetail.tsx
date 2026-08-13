import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listKidsStages, listArticlesForKidsStage, KidsStageDoc } from '@/lib/kidsStages';
import type { ArticleDoc } from '@/lib/articles';

type Status = 'loading' | 'idle' | 'error';

export function KidsStageDetail() {
  const { stageSlug } = useParams<{ stageSlug: string }>();
  const [stage, setStage] = useState<KidsStageDoc | null | undefined>(undefined);
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  useDocumentTitle(stage?.title);

  useEffect(() => {
    if (!stageSlug) return;
    setStatus('loading');
    listKidsStages()
      .then(async (stages) => {
        const found = stages.find((s) => s.slug === stageSlug) ?? null;
        setStage(found);
        if (found) {
          const relatedArticles = await listArticlesForKidsStage(found);
          setArticles(relatedArticles);
        }
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [stageSlug]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/kids" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Back to For Kids
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

      {status === 'idle' && !stage && <p className="mt-6 text-brand-700 dark:text-sand-100">Not found.</p>}

      {status === 'idle' && stage && (
        <article>
          {stage.imageUrl && (
            <img src={stage.imageUrl} alt="" className="mt-6 h-56 w-full rounded-lg object-cover" />
          )}
          <h1 className="mt-6 font-display text-3xl text-brand-700 dark:text-sand-100">{stage.title}</h1>
          <p className="mt-3 text-brand-500 dark:text-brand-100">{stage.summary}</p>

          {stage.body && (
            <div className="prose prose-brand mt-6 max-w-none space-y-4 text-brand-900 dark:text-sand-50">
              {stage.body.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}

          {articles.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-xl text-brand-700 dark:text-sand-100">Related articles</h2>
              <ul className="mt-3 space-y-2">
                {articles.map((article) => (
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
            </section>
          )}
        </article>
      )}
    </main>
  );
}
