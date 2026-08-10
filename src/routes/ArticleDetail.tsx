import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getArticleBySlug, ArticleDoc } from '@/lib/articles';

export function ArticleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleDoc | null | undefined>(undefined);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    if (!slug) return;
    setStatus('loading');
    getArticleBySlug(slug)
      .then((result) => {
        setArticle(result);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [slug]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/learn" className="text-sm text-brand-500 underline">
        ← Back to Learn
      </Link>

      {status === 'loading' && (
        <div className="mt-6 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-8 w-2/3 rounded bg-brand-100" />
          <div className="h-4 w-full rounded bg-brand-100" />
          <div className="h-4 w-full rounded bg-brand-100" />
        </div>
      )}

      {status === 'error' && (
        <p className="mt-6 text-sm text-clay-500">Couldn't load this article right now.</p>
      )}

      {status === 'idle' && !article && (
        <div className="mt-6 rounded-lg border border-brand-100 p-8 text-center text-brand-500">
          <p className="font-medium text-brand-700">Article not found</p>
        </div>
      )}

      {status === 'idle' && article && (
        <article>
          <h1 className="mt-6 font-display text-3xl text-brand-700">{article.title}</h1>
          {article.summary && <p className="mt-3 text-brand-500">{article.summary}</p>}

          <div className="prose prose-brand mt-6 max-w-none space-y-4 text-brand-900">
            {article.body.split('\n\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {article.sources && article.sources.length > 0 && (
            <div className="mt-8 border-t border-brand-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-300">Sources</p>
              <ul className="mt-2 space-y-1 text-sm text-brand-500">
                {article.sources.map((source, i) => (
                  <li key={i}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}
    </main>
  );
}
