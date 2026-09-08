import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchFoods, lookupFood, ChakudyaFood, FoodLookupResult } from '@/lib/chakudya';
import { listArticles, ArticleDoc } from '@/lib/articles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BarcodeScanner } from '@/components/BarcodeScanner';

export function Search() {
  useDocumentTitle('Search');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [foods, setFoods] = useState<ChakudyaFood[]>([]);
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [cascadeFood, setCascadeFood] = useState<FoodLookupResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'empty'>('idle');
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    if (!q) {
      setFoods([]);
      setArticles([]);
      setCascadeFood(null);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    setCascadeFood(null);
    Promise.allSettled([searchFoods({ search: q, limit: 10 }), listArticles({ search: q })])
      .then(async ([foodsResult, articlesResult]) => {
        const foodResults = foodsResult.status === 'fulfilled' ? foodsResult.value : [];
        const articleResults = articlesResult.status === 'fulfilled' ? articlesResult.value : [];
        setFoods(foodResults);
        setArticles(articleResults);

        // No local (Malawi FCT) match — fall back to Chakudya's external
        // cascade (USDA / Open Food Facts / FatSecret) so internationally
        // branded foods (e.g. "Cheerios") aren't a dead end. Skip if the
        // cascade's own local/local_packaged check already covers this —
        // that would just duplicate what searchFoods already found (or
        // didn't).
        let cascade: FoodLookupResult | null = null;
        if (foodResults.length === 0) {
          try {
            const result = await lookupFood(q);
            if (result && result.source !== 'local' && result.source !== 'local_packaged') {
              cascade = result;
            }
          } catch {
            // A cascade miss/error shouldn't block showing article results.
          }
        }
        setCascadeFood(cascade);

        if (foodsResult.status === 'rejected' && articlesResult.status === 'rejected') {
          setStatus('error');
        } else {
          const hasResults = foodResults.length > 0 || articleResults.length > 0 || !!cascade;
          setStatus(hasResults ? 'idle' : 'empty');
        }
      });
  }, [searchParams]);

  function cascadeSourceLabel(source: string) {
    switch (source) {
      case 'usda_fdc':
        return 'USDA FoodData Central';
      case 'open_food_facts':
        return 'Open Food Facts';
      case 'fatsecret':
        return 'FatSecret';
      default:
        return source;
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  }

  function handleBarcodeDetected(code: string) {
    setScannerOpen(false);
    setQuery(code);
    setSearchParams({ q: code });
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Search</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">Search across foods and articles.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <label htmlFor="global-search" className="sr-only">
          Search Thanzi Guide
        </label>
        <div className="relative min-w-0 flex-1">
          <input
            id="global-search"
            type="search"
            autoFocus
            placeholder="Search foods and articles"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-brand-100 bg-white py-2 pl-3 pr-11 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label="Scan a barcode"
            title="Scan a barcode"
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-brand-300 dark:text-brand-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M6 8v8M9 8v8M12 8v8M15 8v8M18 8v8" />
            </svg>
          </button>
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex shrink-0 items-center gap-2 rounded-md bg-brand-500 px-4 py-2 font-medium text-white disabled:opacity-70"
        >
          {status === 'loading' && (
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
          {status === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>

      {scannerOpen && <BarcodeScanner onDetect={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />}

      <div className="mt-8 space-y-10">
        {status === 'loading' && (
          <div className="space-y-3" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <p className="text-sm text-clay-500 dark:text-clay-400">Couldn't reach search right now. Try again shortly.</p>
        )}

        {status === 'empty' && (
          <div className="rounded-lg border border-brand-100 p-8 text-center text-brand-500 dark:text-brand-100 dark:border-ink-800">
            <p className="font-medium text-brand-700 dark:text-sand-100">No results for "{query}"</p>
            <p className="mt-1 text-sm">Try a different search term.</p>
            <Link to="/foods/submit" className="mt-4 inline-block text-sm font-medium text-brand-500 underline dark:text-brand-100">
              Can't find a packaged food? Submit it
            </Link>
          </div>
        )}

        {status === 'idle' && foods.length > 0 && (
          <section>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Foods</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {foods.map((food) => (
                <li key={food.id}>
                  <Link
                    to={`/foods/${food.id}`}
                    className="block rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950"
                  >
                    <p className="font-medium text-brand-700 dark:text-sand-100">{food.food_name}</p>
                    <p className="text-xs text-brand-300 dark:text-brand-100">{food.category}</p>
                    <p className="mt-2 font-mono text-sm text-brand-500 dark:text-brand-100">{food.kcal} kcal</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {status === 'idle' && cascadeFood && (
          <section>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">From other databases</h2>
            <p className="mt-1 text-xs text-brand-300 dark:text-brand-100">
              Not yet in the Malawi food database — found via {cascadeSourceLabel(cascadeFood.source)}.
            </p>
            <div className="mt-3 rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
              <p className="font-medium text-brand-700 dark:text-sand-100">{cascadeFood.food.food_name}</p>
              <p className="text-xs text-brand-300 dark:text-brand-100">{cascadeFood.food.category}</p>
              <p className="mt-2 font-mono text-sm text-brand-500 dark:text-brand-100">
                {cascadeFood.food.energy_kcal ?? '—'} kcal · P {cascadeFood.food.protein_g ?? '—'}g · C{' '}
                {cascadeFood.food.carbs_g ?? '—'}g · F {cascadeFood.food.fat_g ?? '—'}g
              </p>
              <Link
                to="/foods/submit"
                className="mt-3 inline-block text-xs font-medium text-brand-500 underline dark:text-brand-100"
              >
                Add this to the Malawi database
              </Link>
            </div>
          </section>
        )}

        {status === 'idle' && articles.length > 0 && (
          <section>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Articles</h2>
            <ul className="mt-3 space-y-3">
              {articles.map((article) => (
                <li key={article.$id}>
                  <Link
                    to={`/learn/${article.slug}`}
                    className="block rounded-lg border border-brand-100 bg-white p-5 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950"
                  >
                    <p className="font-display text-lg text-brand-700 dark:text-sand-100">{article.title}</p>
                    {article.summary && <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">{article.summary}</p>}
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
