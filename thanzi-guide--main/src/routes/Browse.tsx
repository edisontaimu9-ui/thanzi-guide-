import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SearchIcon } from '@/components/LibraryIcons';
import {
  FoodsIcon,
  RecipesIcon,
  HealthIcon,
  FitnessIcon,
  KidsIcon,
  WomenIcon,
  MenIcon,
  SeniorsIcon,
  ArticlesIcon,
  CoursesIcon,
  ToolsIcon,
  CareIcon
} from '@/components/BrowseIcons';
import { BookIcon } from '@/components/LibraryIcons';

type BrowseItem = {
  to: string;
  label: string;
  blurb: string;
  icon: typeof FoodsIcon;
};

type BrowseSection = {
  title: string;
  items: BrowseItem[];
};

const SECTIONS: BrowseSection[] = [
  {
    title: 'Nutrition',
    items: [
      { to: '/foods', label: 'Foods', blurb: 'Search Malawian foods for calories, protein, carbs, and fat', icon: FoodsIcon },
      { to: '/recipes', label: 'Recipes', blurb: 'Healthful, everyday Malawian recipes by category', icon: RecipesIcon }
    ]
  },
  {
    title: 'Health & fitness',
    items: [
      { to: '/health', label: 'Health', blurb: 'Topics on staying well, condition by condition', icon: HealthIcon },
      { to: '/fitness', label: 'Fitness', blurb: 'Movement and exercise guidance for every level', icon: FitnessIcon }
    ]
  },
  {
    title: 'By life stage',
    items: [
      { to: '/women', label: 'Women', blurb: 'Nutrition and health guidance for women', icon: WomenIcon },
      { to: '/men', label: 'Men', blurb: 'Nutrition and health guidance for men', icon: MenIcon },
      { to: '/kids', label: 'Kids', blurb: 'Browse by age and stage, from infancy up', icon: KidsIcon },
      { to: '/seniors', label: 'Seniors', blurb: 'Guidance for healthy ageing', icon: SeniorsIcon }
    ]
  },
  {
    title: 'Learn',
    items: [
      { to: '/learn', label: 'Articles', blurb: 'Short reads on nutrition and healthy living', icon: ArticlesIcon },
      { to: '/courses', label: 'Courses', blurb: 'Structured lessons to learn at your own pace', icon: CoursesIcon }
    ]
  },
  {
    title: 'Resources',
    items: [
      { to: '/tools', label: 'Tools', blurb: 'Calculators for BMI, energy needs, and more', icon: ToolsIcon },
      { to: '/library', label: 'Library', blurb: 'Books, guidelines, and research behind the app', icon: BookIcon },
      { to: '/care', label: 'Find care', blurb: 'Connect with dietitians and providers near you', icon: CareIcon }
    ]
  }
];

export function Browse() {
  useDocumentTitle('Browse');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header>
        <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Browse</h1>
        <p className="mt-2 max-w-2xl text-brand-500 dark:text-brand-100">
          Everything in Thanzi Guide, organized by topic — foods, recipes, health, fitness, life
          stages, and the tools and resources behind it all.
        </p>

        <form onSubmit={handleSubmit} className="relative mt-6 max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-300 dark:text-brand-100/60" />
          <label htmlFor="browse-search" className="sr-only">
            Search Thanzi Guide
          </label>
          <input
            id="browse-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods, articles, and more…"
            className="w-full rounded-full border border-brand-100 bg-white py-2.5 pl-9 pr-4 text-sm text-brand-900 shadow-sm placeholder:text-brand-300 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50 dark:placeholder:text-brand-100/40"
          />
        </form>
      </header>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">{section.title}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {section.items.map((item) => (
                <BrowseCard key={item.to} {...item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function BrowseCard({ to, label, blurb, icon: Icon }: BrowseItem) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start rounded-2xl border border-brand-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-ink-800 dark:bg-ink-950 dark:hover:border-brand-500/50"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-ink-900 dark:text-sand-100 dark:group-hover:bg-brand-500 dark:group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-base leading-snug text-brand-700 dark:text-sand-100">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-500 dark:text-brand-100/80">{blurb}</p>
    </Link>
  );
}
