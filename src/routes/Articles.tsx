import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listArticleCategories, listArticles, CategoryDoc, ArticleDoc } from '@/lib/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Articles() {
  useDocumentTitle('Learn');
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get('category');

  const [categories, setCategories] = useState<CategoryDoc[]>([]);
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    listArticleCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setStatus('loading');
    const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined;
    if (categorySlug && categories.length > 0 && !category) {
      // Category slug in URL doesn't match a known category — show empty state honestly.
      setArticles([]);
      setStatus('idle');
      return;
    }
    listArticles({ categoryId: category?.$id })
      .then((results) => {
        setArticles(results);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [categorySlug, categories]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700">Learn</h1>
      <p className="mt-2 text-brand-500">
        Nutrition and health articles, reviewed for accuracy — more are added over time.
      </p>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSearchParams({})}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              !categorySlug ? 'border-brand-500 bg-brand-500 text-white' : 'border-brand-100 text-brand-700'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.$id}
              onClick={() => setSearchParams({ category: cat.slug })}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                categorySlug === cat.slug
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-brand-100 text-brand-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {status === 'loading' && (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-brand-100 bg-white" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-clay-500">Couldn't load articles right now.</p>
        )}

        {status === 'idle' && articles.length === 0 && (
          <div className="rounded-lg border border-brand-100 p-8 text-center text-brand-500">
            <p className="font-medium text-brand-700">No articles here yet</p>
            <p className="mt-1 text-sm">This section is still being built out.</p>
          </div>
        )}

        {status === 'idle' && articles.length > 0 && (
          <ul className="space-y-3">
            {articles.map((article) => (
              <li key={article.$id}>
                <Link
                  to={`/learn/${article.slug}`}
                  className="block rounded-lg border border-brand-100 bg-white p-5 transition hover:border-brand-500"
                >
                  <p className="font-display text-lg text-brand-700">{article.title}</p>
                  {article.summary && <p className="mt-1 text-sm text-brand-500">{article.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
