import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchFoods, ChakudyaFood } from '@/lib/chakudya';
import { listArticles, ArticleDoc } from '@/lib/articles';
import { useAuth } from '@/lib/auth-context';

// `highlight: true` topics show on the homepage by default; the rest are
// tucked behind "Show more topics" so the section doesn't turn into a wall
// of pills. All of them are still real links either way.
const topics = [
  { label: 'Nutrition basics', slug: 'nutrition-basics', highlight: true },
  { label: 'Maternal nutrition', slug: 'maternal-nutrition', highlight: true },
  { label: 'Child nutrition', slug: 'child-nutrition', highlight: true },
  { label: 'Breastfeeding & complementary feeding', slug: 'breastfeeding-complementary-feeding', highlight: true },
  { label: 'Malnutrition', slug: 'malnutrition', highlight: true },
  { label: 'Healthy eating', slug: 'healthy-eating', highlight: true },
  { label: 'HIV & nutrition', slug: 'hiv-nutrition', highlight: true },
  { label: 'Anaemia', slug: 'anaemia', highlight: true },
  { label: 'Diabetes', slug: 'diabetes', highlight: true },
  { label: 'High blood pressure', slug: 'high-blood-pressure', highlight: true },
  { label: 'Food safety', slug: 'food-safety' },
  { label: 'Physical activity', slug: 'physical-activity' },
  { label: 'Water, sanitation & hygiene', slug: 'wash' },
  { label: 'Preventive health', slug: 'preventive-health' },
  { label: 'Heart health', slug: 'heart-health' },
  { label: 'Micronutrients', slug: 'micronutrients' },
  { label: "Women's health", slug: 'womens-health' },
  { label: "Men's health", slug: 'mens-health' },
  { label: 'Mental health', slug: 'mental-health' },
  { label: 'Sexual & reproductive health', slug: 'sexual-reproductive-health' },
  { label: 'Infectious diseases', slug: 'infectious-diseases' },
  { label: 'Adolescent health', slug: 'adolescent-health' },
  { label: 'Healthy ageing', slug: 'healthy-ageing' },
  { label: 'Oral health', slug: 'oral-health' },
  { label: 'Eye health', slug: 'eye-health' },
  { label: 'Environmental health', slug: 'environmental-health' },
  { label: 'Emergency & first aid', slug: 'emergency-first-aid' },
  { label: 'Food & nutrition myths', slug: 'food-nutrition-myths' }
];

export function Home() {
  return (
    <>
      <Hero />
      <TopicsPreview />
      <FeaturedArticles />
      <QuoteBanner />
      <FoodsPreview />
      <ExploreSection />
      <ToolsPreview />
    </>
  );
}

function Hero() {
  const { user, loading } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500">
      {/* Ambient glow accents — Lake Malawi teal warmed by a gold sunset glow */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-clay-400/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-brand-100/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div>
          <span className="inline-flex items-center rounded-full border border-clay-400/40 bg-clay-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-clay-400">
            Health &amp; nutrition, explained for Malawi
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight text-sand-50 sm:text-5xl">
            Learn about your health.
            <br />
            Understand your food.
            <br />
            <span className="text-clay-400">Make better choices.</span>
          </h1>
          <p className="mt-5 max-w-md text-brand-100">
            Search real Malawian foods, read nutrition guidance you can trust,
            and use simple tools built for local life, not imported medical
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
              className="flex-1 rounded-md border border-white/20 bg-white/95 px-3 py-2.5 text-brand-900 placeholder:text-brand-300 focus:border-clay-400 focus:outline-none focus:ring-2 focus:ring-clay-400/50"
            />
            <button
              type="submit"
              className="rounded-md bg-clay-400 px-5 py-2.5 font-semibold text-brand-900 transition hover:bg-clay-500"
            >
              Search
            </button>
          </form>
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
            {!loading && (
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="rounded-full bg-sand-50 px-4 py-2 font-semibold text-brand-700 transition hover:bg-white"
              >
                {user ? 'Go to your dashboard' : 'Create your free account'}
              </Link>
            )}
            <Link
              to="/foods"
              className="font-medium text-sand-50 underline decoration-clay-400 underline-offset-4 hover:text-clay-400"
            >
              Browse the food database →
            </Link>
          </div>
        </div>

        <FoodSnapshot />
      </div>

      {/* Shoreline divider into the page body */}
      <svg
        className="relative -mb-1 block h-12 w-full text-sand-50 dark:text-ink-950 sm:h-20"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,40 L1440,100 L0,100 Z" />
      </svg>
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
    <div className="rounded-2xl border border-clay-400/30 bg-sand-50/95 p-6 shadow-2xl shadow-brand-900/40 backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-300">
        From the food database
      </p>

      {status === 'loading' || !food ? (
        <div className="mt-3 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-5 w-2/3 rounded bg-brand-100" />
          <div className="h-16 rounded bg-brand-100" />
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
                  className={`h-1.5 w-4 rounded-full ${i === index ? 'bg-clay-400' : 'bg-brand-100'}`}
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
  const [showAll, setShowAll] = useState(false);
  const highlighted = topics.filter((t) => t.highlight);
  const rest = topics.filter((t) => !t.highlight);
  const visible = showAll ? topics : highlighted;

  return (
    <section className="border-y border-brand-100 bg-sand-100 dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="font-display text-2xl text-brand-700 dark:text-sand-50">What you'll find here</h2>
        <p className="mt-2 max-w-xl text-brand-500 dark:text-brand-100">
          Nutrition and health topics for Malawi. Coverage is growing. Some
          topics have articles now, others are still being written.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Topics">
          {visible.map((topic) => (
            <li key={topic.slug}>
              <Link
                to={`/learn?category=${topic.slug}`}
                className="inline-block rounded-full border border-brand-100 bg-white px-4 py-1.5 text-sm text-brand-700 hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
              >
                {topic.label}
              </Link>
            </li>
          ))}
        </ul>
        {rest.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-4 text-sm font-medium text-brand-700 underline dark:text-sand-100"
          >
            {showAll ? 'Show fewer topics' : `Show ${rest.length} more topics`}
          </button>
        )}
      </div>
    </section>
  );
}

// Two enduring lines from Hippocrates on food and medicine — a natural
// fit for a nutrition-education app. Rotates like FoodSnapshot does, so the
// homepage keeps a consistent "quietly alive" feel between sections.
const quotes = [
  {
    text: 'Wherever the art of medicine is loved, there is also a love of humanity.',
    author: 'Hippocrates'
  },
  {
    text: 'Our food should be our medicine, and our medicine should be our food.',
    author: 'Hippocrates'
  }
];

function QuoteBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (quotes.length < 2) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const quote = quotes[index];

  return (
    <section className="border-y border-brand-100 bg-sand-100 dark:border-ink-800 dark:bg-ink-900">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="font-display text-2xl italic leading-snug text-brand-700 dark:text-sand-50 sm:text-3xl">
          &ldquo;{quote.text}&rdquo;
        </p>
        <div className="mx-auto mt-6 h-0.5 w-10 bg-clay-400" aria-hidden="true" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-clay-500 dark:text-clay-400">
          {quote.author}
        </p>
        {quotes.length > 1 && (
          <div className="mt-6 flex justify-center gap-1.5" role="tablist" aria-label="Quotes">
            {quotes.map((q, i) => (
              <button
                key={q.text}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Quote ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-4 rounded-full ${i === index ? 'bg-clay-400' : 'bg-brand-100 dark:bg-ink-800'}`}
              />
            ))}
          </div>
        )}
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
        <h2 className="font-display text-2xl text-brand-700 dark:text-sand-50">Foods of Malawi</h2>
        <Link to="/foods" className="text-sm font-medium text-brand-500 underline dark:text-brand-100">
          See all
        </Link>
      </div>

      {status === 'error' && (
        <p className="mt-4 text-sm text-clay-500 dark:text-clay-400">Couldn't load foods right now.</p>
      )}

      {status !== 'error' && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {status === 'loading'
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950" />
              ))
            : foods.map((food) => (
                <Link
                  key={food.id}
                  to={`/foods/${food.id}`}
                  className="rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950"
                >
                  <p className="font-medium text-brand-700 dark:text-sand-50">{food.food_name}</p>
                  <p className="text-xs text-brand-300 dark:text-brand-100">{food.category}</p>
                  <p className="mt-3 font-mono text-sm text-brand-500 dark:text-brand-100">{food.kcal} kcal</p>
                </Link>
              ))}
        </div>
      )}
    </section>
  );
}

function FeaturedArticles() {
  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    listArticles()
      .then((results) => {
        const sorted = [...results].sort((a, b) =>
          (b.publishedAt ?? b.$createdAt).localeCompare(a.publishedAt ?? a.$createdAt)
        );
        setArticles(sorted.slice(0, 3));
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'error') return null;
  if (status === 'idle' && articles.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl text-brand-700 dark:text-sand-50">Featured articles</h2>
        <Link to="/learn" className="text-sm font-medium text-brand-500 underline dark:text-brand-100">
          See all
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {status === 'loading'
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950"
              />
            ))
          : articles.map((article) => (
              <Link
                key={article.$id}
                to={`/learn/${article.slug}`}
                className="rounded-lg border border-brand-100 bg-white p-5 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950"
              >
                <p className="font-display text-lg text-brand-700 dark:text-sand-50">{article.title}</p>
                {article.summary && (
                  <p className="mt-2 line-clamp-3 text-sm text-brand-500 dark:text-brand-100">{article.summary}</p>
                )}
              </Link>
            ))}
      </div>
    </section>
  );
}

function ExploreSection() {
  const items = [
    { label: 'Health', description: 'Guidance by topic and life stage', to: '/health' },
    { label: 'Fitness', description: 'Activity and exercise nutrition', to: '/fitness' },
    { label: 'Recipes', description: 'Malawian dishes, category by category', to: '/recipes' },
    { label: 'For Kids', description: 'Nutrition by age and stage', to: '/kids' }
  ];

  return (
    <section className="border-y border-brand-100 bg-sand-100 dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl text-brand-700 dark:text-sand-50">Explore more</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg border border-brand-100 bg-white p-5 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-900"
            >
              <p className="font-display text-lg text-brand-700 dark:text-sand-50">{item.label}</p>
              <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolsPreview() {
  return (
    <section className="border-t border-brand-100 bg-brand-700 dark:border-ink-800">
      <div className="mx-auto max-w-5xl px-6 py-16 text-sand-50">
        <h2 className="font-display text-2xl">Tools, built for local use</h2>
        <p className="mt-2 max-w-xl text-brand-100">
          A BMI calculator and a daily energy estimator: quick, clear
          estimates, not diagnoses.
        </p>
        <Link
          to="/tools"
          className="mt-6 inline-block rounded-md border border-sand-50 px-4 py-2 text-sm font-medium hover:bg-sand-50 hover:text-brand-700"
        >
          Try the tools
        </Link>
      </div>
    </section>
  );
}
