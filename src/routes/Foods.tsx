import { useEffect, useState, useCallback, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchFoods, ChakudyaFood } from '@/lib/chakudya';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type FoodTopic = {
  title: string;
  body: string;
};

const FOOD_TOPICS: FoodTopic[] = [
  {
    title: 'Food Groups',
    body: 'Get to know the main food groups — staples like nsima and rice, proteins such as beans and fish, vegetables, fruits, and fats — and how balancing them supports everyday health.',
  },
  {
    title: 'Home Food Safety',
    body: 'Simple habits for keeping food safe at home: washing hands and produce, cooking meat and fish thoroughly, storing leftovers properly, and avoiding cross-contamination in the kitchen.',
  },
  {
    title: 'Planning',
    body: 'Tips for planning meals ahead of time — building a shopping list around what is in season and affordable, and putting together balanced meals for the week.',
  },
  {
    title: 'Food Preparation',
    body: 'Guidance on preparing meals in ways that keep more of their nutrients — from choosing gentle cooking methods to cutting down on added oil, salt, and sugar.',
  },
  {
    title: 'Cultural Cuisines and Traditions',
    body: 'Food carries culture and history. Explore how traditional Malawian dishes and ingredients fit into a balanced, nutritious diet.',
  },
];

function FoodTopicAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mt-10 rounded-lg border border-brand-100 bg-sand-50 p-6 dark:border-ink-800 dark:bg-ink-900/40">
      <h2 className="font-display text-xl text-brand-700 dark:text-sand-100">Food</h2>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Food is at the heart of daily life — it nourishes us and shapes our culture and traditions.
        Learn about the role each food group plays, and how to plan, prepare, and store meals and
        snacks safely.
      </p>

      <ul className="mt-5 divide-y divide-brand-100 dark:divide-ink-800">
        {FOOD_TOPICS.map((topic, index) => {
          const isOpen = openIndex === index;
          return (
            <li key={topic.title}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
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
                <p className="pb-4 text-sm text-brand-500 dark:text-brand-100">{topic.body}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Foods() {
  useDocumentTitle('Foods');
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') ?? '');
  const [foods, setFoods] = useState<ChakudyaFood[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const runSearch = useCallback(async (search: string) => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const results = await searchFoods({ search: search || undefined, limit: 30 });
      setFoods(results);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not reach the food database. Try again.'
      );
    }
  }, []);

  useEffect(() => {
    runSearch(searchParams.get('search') ?? '');
    // Only re-run when the URL's search param changes (e.g. arriving from the homepage).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('search')]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSearchParams(query ? { search: query } : {});
    runSearch(query);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Malawian foods</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Search foods to see calories, protein, carbs, and fat per typical serving.
      </p>

      <FoodTopicAccordion />

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <label htmlFor="food-search" className="sr-only">
          Search foods
        </label>
        <input
          id="food-search"
          type="search"
          placeholder="Search foods, e.g. nsima, beans, groundnuts"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
        />
        <button
          type="submit"
          className="rounded-md bg-brand-500 px-4 py-2 font-medium text-white"
        >
          Search
        </button>
      </form>

      <div className="mt-8">
        {status === 'loading' && <FoodListSkeleton />}

        {status === 'error' && (
          <div role="alert" className="rounded-md border border-clay-400 bg-clay-400/10 p-4 text-clay-500 dark:text-clay-400">
            <p className="font-medium">Couldn't load foods</p>
            <p className="mt-1 text-sm">{errorMessage}</p>
            <button
              onClick={() => runSearch(query)}
              className="mt-3 text-sm font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'idle' && foods.length === 0 && (
          <div className="rounded-md border border-brand-100 p-8 text-center text-brand-500 dark:text-brand-100 dark:border-ink-800">
            <p className="font-medium text-brand-700 dark:text-sand-100">No foods matched "{query}"</p>
            <p className="mt-1 text-sm">Try a different name, or browse without a search term.</p>
          </div>
        )}

        {status === 'idle' && foods.length > 0 && (
          <ul className="mt-2 grid gap-3 sm:grid-cols-2">
            {foods.map((food) => (
              <li key={food.id}>
                <Link
                  to={`/foods/${food.id}`}
                  className="block rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950"
                >
                  <p className="font-medium text-brand-700 dark:text-sand-100">{food.food_name}</p>
                  <p className="text-sm text-brand-300 dark:text-brand-100">{food.category} · {food.measure}</p>
                  <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs text-brand-500 dark:text-brand-100">
                    <div>
                      <dt className="font-mono font-semibold text-brand-700 dark:text-sand-100">{food.kcal}</dt>
                      <dd>kcal</dd>
                    </div>
                    <div>
                      <dt className="font-mono font-semibold text-brand-700 dark:text-sand-100">{food.protein_g}g</dt>
                      <dd>protein</dd>
                    </div>
                    <div>
                      <dt className="font-mono font-semibold text-brand-700 dark:text-sand-100">{food.carbs_g}g</dt>
                      <dd>carbs</dd>
                    </div>
                    <div>
                      <dt className="font-mono font-semibold text-brand-700 dark:text-sand-100">{food.fat_g}g</dt>
                      <dd>fat</dd>
                    </div>
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function FoodListSkeleton() {
  return (
    <ul className="mt-2 grid gap-3 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="animate-pulse rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
          <div className="h-4 w-2/3 rounded bg-brand-100 dark:bg-ink-900" />
          <div className="mt-2 h-3 w-1/3 rounded bg-brand-100 dark:bg-ink-900" />
          <div className="mt-4 h-8 rounded bg-brand-100 dark:bg-ink-900" />
        </li>
      ))}
    </ul>
  );
}
