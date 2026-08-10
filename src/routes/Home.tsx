import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchFoods, ChakudyaFood } from '@/lib/chakudya';

const topics = [
  { label: 'Nutrition basics', slug: 'nutrition-basics' },
  { label: 'Maternal nutrition', slug: 'maternal-nutrition' },
  { label: 'Child nutrition', slug: 'child-nutrition' },
  { label: 'Malnutrition', slug: 'malnutrition' },
  { label: 'Food safety', slug: 'food-safety' },
  { label: 'Physical activity', slug: 'physical-activity' },
  { label: 'Water, sanitation & hygiene', slug: 'wash' },
  { label: 'Preventive health', slug: 'preventive-health' }
];

export function Home() {
  return (
    <>
      <Hero />
      <TopicsPreview />
      <FoodsPreview />
      <ToolsPreview />
    </>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[3fr_2fr] lg:items-center">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-clay-500">
          Health &amp; nutrition, explained for Malawi
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-brand-700 sm:text-5xl">
          Learn about your health.
          <br />
          Understand your food.
          <br />
          Make better choices.
        </h1>
        <p className="mt-5 max-w-md text-brand-500">
          Search real Malawian foods, read nutrition guidance you can trust,
          and use simple tools built for local life — not imported medical
          templates.
        </p>
        <form action="/search" className="mt-8 flex max-w-md gap-2">
          <label htmlFor="hero-search" className="sr-only">
            Search foods
          </label>
          <input
            id="hero-search"
            name="q"
            type="search"
            placeholder="Search a food, e.g. groundnuts"
            className="flex-1 rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/signup" className="font-medium text-brand-700 underline">
            Create your free account
          </Link>
          <span className="text-brand-300">·</span>
          <Link to="/foods" className="font-medium text-brand-700 underline">
            Browse the food database
          </Link>
        </div>
      </div>

      <FoodSnapshot />
    </section>
  );
}

/**
 * Live-data signature element: cycles through a few real foods pulled from
 * the Chakudya Nutrition Registry, so the homepage shows the actual thing
 * Thanzi Guide does rather than decorative stats.
 */
function FoodSnapshot() {
  const [foods, setFoods] = useState<ChakudyaFood[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    searchFoods({ limit: 5 })
      .then((results) => {
        setFoods(results);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    if (foods.length < 2) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % foods.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [foods]);

  if (status === 'error') return null;

  const food = foods[index];

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-300">
        From the food database
      </p>

      {status === 'loading' || !food ? (
        <div className="mt-3 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-5 w-2/3 rounded bg-brand-50" />
          <div className="h-16 rounded bg-brand-50" />
        </div>
      ) : (
        <>
          <p className="mt-2 font-display text-xl text-brand-700">{food.food_name}</p>
          <p className="text-sm text-brand-300">
            {food.category} · {food.measure}
          </p>
          <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
            <Stat label="kcal" value={food.kcal} />
            <Stat label="protein" value={`${food.protein_g}g`} />
            <Stat label="carbs" value={`${food.carbs_g}g`} />
            <Stat label="fat" value={`${food.fat_g}g`} />
          </dl>
          {foods.length > 1 && (
            <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Food examples">
              {foods.map((f, i) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={f.food_name}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-4 rounded-full ${i === index ? 'bg-brand-500' : 'bg-brand-100'}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="font-mono text-base font-semibold text-brand-700">{value}</dt>
      <dd className="text-[11px] uppercase tracking-wide text-brand-300">{label}</dd>
    </div>
  );
}

function TopicsPreview() {
  return (
    <section className="border-y border-brand-100 bg-sand-100">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="font-display text-2xl text-brand-700">What you'll find here</h2>
        <p className="mt-2 max-w-xl text-brand-500">
          Nutrition and health topics for Malawi. Coverage is growing — some
          topics have articles now, others are still being written.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Topics">
          {topics.map((topic) => (
            <li key={topic.slug}>
              <Link
                to={`/learn?category=${topic.slug}`}
                className="inline-block rounded-full border border-brand-100 bg-white px-4 py-1.5 text-sm text-brand-700 hover:border-brand-500"
              >
                {topic.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FoodsPreview() {
  const [foods, setFoods] = useState<ChakudyaFood[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    searchFoods({ limit: 4 })
      .then((results) => {
        setFoods(results);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-brand-700">Foods of Malawi</h2>
        <Link to="/foods" className="text-sm font-medium text-brand-500 underline">
          See all
        </Link>
      </div>

      {status === 'error' && (
        <p className="mt-4 text-sm text-clay-500">Couldn't load foods right now.</p>
      )}

      {status !== 'error' && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {status === 'loading'
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg border border-brand-100 bg-white" />
              ))
            : foods.map((food) => (
                <Link
                  key={food.id}
                  to={`/foods/${food.id}`}
                  className="rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500"
                >
                  <p className="font-medium text-brand-700">{food.food_name}</p>
                  <p className="text-xs text-brand-300">{food.category}</p>
                  <p className="mt-3 font-mono text-sm text-brand-500">{food.kcal} kcal</p>
                </Link>
              ))}
        </div>
      )}
    </section>
  );
}

function ToolsPreview() {
  return (
    <section className="border-t border-brand-100 bg-brand-700">
      <div className="mx-auto max-w-5xl px-6 py-16 text-sand-50">
        <h2 className="font-display text-2xl">Tools, built for local use</h2>
        <p className="mt-2 max-w-xl text-brand-100">
          A BMI calculator and a basic energy estimator are in progress —
          both will clearly explain that they give estimates, not diagnoses.
        </p>
        <Link
          to="/tools"
          className="mt-6 inline-block rounded-md border border-sand-50 px-4 py-2 text-sm font-medium hover:bg-sand-50 hover:text-brand-700"
        >
          See what's planned
        </Link>
      </div>
    </section>
  );
}
