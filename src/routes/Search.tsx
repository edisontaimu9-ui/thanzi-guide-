import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchFoods, ChakudyaFood } from '@/lib/chakudya';
import { listArticles, ArticleDoc } from '@/lib/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Search() {
  useDocumentTitle('Search');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [foods, setFoods] = useState<ChakudyaFood[]>([]);
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    if (!q) {
      setFoods([]);
      setArticles([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    Promise.allSettled([searchFoods({ search: q, limit: 10 }), listArticles({ search: q })])
      .then(([foodsResult, articlesResult]) => {
        const foodResults = foodsResult.status === 'fulfilled' ? foodsResult.value : [];
        const articleResults = articlesResult.status === 'fulfilled' ? articlesResult.value : [];
        setFoods(foodResults);
        setArticles(articleResults);
        if (foodsResult.status === 'rejected' && articlesResult.status === 'rejected') {
          setStatus('error');
        } else {
          setStatus(foodResults.length === 0 && articleResults.length === 0 ? 'empty' : 'idle');
        }
      });
  }, [searchParams]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700">Search</h1>
      <p className="mt-2 text-brand-500">Search across foods and articles.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <label htmlFor="global-search" className="sr-only">
          Search Thanzi Guide
        </label>
        <input
          id="global-search"
          type="search"
          autoFocus
          placeholder="Search foods and articles"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-md border border-brand-100 px-3 py-2 focus:border-brand-500"
        />
        <button type="submit" className="rounded-md bg-brand-500 px-4 py-2 font-medium text-white">
          Search
        </button>
      </form>

      <div className="mt-8 space-y-10">
        {status === 'loading' && (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border border-brand-100 bg-white" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-clay-500">Couldn't reach search right now. Try again shortly.</p>
        )}

        {status === 'empty' && (
          <div className="rounded-lg border border-brand-100 p-8 text-center text-brand-500">
            <p className="font-medium text-brand-700">No results for "{query}"</p>
            <p className="mt-1 text-sm">Try a different search term.</p>
          </div>
        )}

        {status === 'idle' && foods.length > 0 && (
          <section>
            <h2 className="font-display text-lg text-brand-700">Foods</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {foods.map((food) => (
                <li key={food.id}>
                  <Link
                    to={`/foods/${food.id}`}
                    className="block rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500"
                  >
                    <p className="font-medium text-brand-700">{food.food_name}</p>
                    <p className="text-xs text-brand-300">{food.category}</p>
                    <p className="mt-2 font-mono text-sm text-brand-500">{food.kcal} kcal</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {status === 'idle' && articles.length > 0 && (
          <section>
            <h2 className="font-display text-lg text-brand-700">Articles</h2>
            <ul className="mt-3 space-y-3">
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
          </section>
        )}
      </div>
    </main>
  );
}
