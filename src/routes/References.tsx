import { useEffect, useMemo, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listPublishedReferences, ReferenceDoc } from '@/lib/publicReferences';
import { REFERENCE_CATEGORIES, ReferenceCategory } from '@/lib/referenceCategories';
import { getFileViewUrl, getFileDownloadUrl } from '@/lib/storage';
import { BUCKETS } from '@/lib/appwrite';
import { LoadingRunner } from '@/components/LoadingRunner';
import {
  BookIcon,
  GuidelineIcon,
  ResearchIcon,
  AcademicIcon,
  MalawiIcon,
  GlobalIcon,
  DataIcon,
  ClinicalToolsIcon,
  SearchIcon,
  FolderIcon,
  ChevronLeftIcon,
  ExternalLinkIcon,
  DownloadIcon
} from '@/components/LibraryIcons';

const UNCATEGORIZED = 'Uncategorized';

const SHELVES: Record<ReferenceCategory, { icon: typeof BookIcon; blurb: string }> = {
  Books: { icon: BookIcon, blurb: 'Full-length textbooks and reference volumes' },
  'Clinical Nutrition Guidelines': { icon: GuidelineIcon, blurb: 'Protocols, standards, and clinical guidance' },
  'Research Articles': { icon: ResearchIcon, blurb: 'Peer-reviewed studies and journal papers' },
  'Academic Materials': { icon: AcademicIcon, blurb: 'Lecture notes, coursework, and study material' },
  'Malawi Nutrition Resources': { icon: MalawiIcon, blurb: 'National guidance and locally-focused sources' },
  'Global Nutrition': { icon: GlobalIcon, blurb: 'WHO, FAO, and international nutrition bodies' },
  'Food & Nutrition Data': { icon: DataIcon, blurb: 'Composition tables and reference datasets' },
  'Clinical Tools': { icon: ClinicalToolsIcon, blurb: 'Calculators, charts, and assessment aids' }
};

function shelfOf(ref: ReferenceDoc): string {
  const cat = ref.category?.trim();
  return cat && (REFERENCE_CATEGORIES as readonly string[]).includes(cat) ? cat : UNCATEGORIZED;
}

export function References() {
  useDocumentTitle('Library');
  const [references, setReferences] = useState<ReferenceDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [activeShelf, setActiveShelf] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    listPublishedReferences()
      .then((docs) => {
        setReferences(docs);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  const countsByShelf = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ref of references) {
      const shelf = shelfOf(ref);
      counts[shelf] = (counts[shelf] ?? 0) + 1;
    }
    return counts;
  }, [references]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return references.filter((ref) => {
      const haystack = [ref.title, ref.publisher, ref.category, String(ref.year ?? '')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [references, query]);

  const shelfResults = useMemo(() => {
    if (!activeShelf) return [];
    return references.filter((ref) => shelfOf(ref) === activeShelf);
  }, [references, activeShelf]);

  const hasUncategorized = (countsByShelf[UNCATEGORIZED] ?? 0) > 0;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="border-b border-brand-100 pb-8 dark:border-ink-800">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clay-500 dark:text-clay-400">
          Thanzi Guide
        </p>
        <h1 className="mt-2 font-display text-4xl text-brand-700 dark:text-sand-100">Digital Nutrition Library</h1>
        <p className="mt-3 max-w-2xl text-brand-500 dark:text-brand-100">
          Curated books, clinical guidelines, research, and data behind every page of Thanzi Guide — organized into
          shelves so you can browse by subject or search across all of it at once.
        </p>

        <div className="relative mt-6 max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-300 dark:text-brand-100/60" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, publishers, categories…"
            className="w-full rounded-full border border-brand-100 bg-white py-2.5 pl-9 pr-4 text-sm text-brand-900 shadow-sm placeholder:text-brand-300 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50 dark:placeholder:text-brand-100/40"
          />
        </div>
      </header>

      {status === 'loading' && <LoadingRunner className="mt-12" />}
      {status === 'error' && (
        <p role="alert" className="mt-12 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load the library right now.
        </p>
      )}

      {status === 'idle' && references.length === 0 && (
        <p className="mt-12 text-brand-500 dark:text-brand-100">No references published yet.</p>
      )}

      {status === 'idle' && references.length > 0 && searchResults && (
        <section className="mt-8">
          <p className="text-sm text-brand-500 dark:text-brand-100">
            {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{query.trim()}"
          </p>
          <ReferenceShelfList references={searchResults} emptyLabel="No matches. Try a different search." />
        </section>
      )}

      {status === 'idle' && references.length > 0 && !searchResults && !activeShelf && (
        <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {REFERENCE_CATEGORIES.map((label) => {
            const { icon: Icon, blurb } = SHELVES[label];
            const count = countsByShelf[label] ?? 0;
            return (
              <ShelfCard
                key={label}
                icon={Icon}
                label={label}
                blurb={blurb}
                count={count}
                onClick={() => setActiveShelf(label)}
              />
            );
          })}
          {hasUncategorized && (
            <ShelfCard
              icon={FolderIcon}
              label={UNCATEGORIZED}
              blurb="Not yet assigned to a shelf"
              count={countsByShelf[UNCATEGORIZED]}
              onClick={() => setActiveShelf(UNCATEGORIZED)}
            />
          )}
        </section>
      )}

      {status === 'idle' && references.length > 0 && !searchResults && activeShelf && (
        <section className="mt-8">
          <button
            onClick={() => setActiveShelf(null)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-sand-100"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            All shelves
          </button>

          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-ink-900 dark:text-sand-100">
              {(() => {
                const Icon = activeShelf === UNCATEGORIZED ? FolderIcon : SHELVES[activeShelf as ReferenceCategory].icon;
                return <Icon className="h-5 w-5" />;
              })()}
            </span>
            <div>
              <h2 className="font-display text-2xl text-brand-700 dark:text-sand-100">{activeShelf}</h2>
              <p className="text-sm text-brand-500 dark:text-brand-100">
                {shelfResults.length} item{shelfResults.length === 1 ? '' : 's'} on this shelf
              </p>
            </div>
          </div>

          <ReferenceShelfList references={shelfResults} emptyLabel="No resources on this shelf yet." />
        </section>
      )}
    </main>
  );
}

function ShelfCard({
  icon: Icon,
  label,
  blurb,
  count,
  onClick
}: {
  icon: typeof BookIcon;
  label: string;
  blurb: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start rounded-2xl border border-brand-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-ink-800 dark:bg-ink-950 dark:hover:border-brand-500/50"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-ink-900 dark:text-sand-100 dark:group-hover:bg-brand-500 dark:group-hover:text-white">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-base leading-snug text-brand-700 dark:text-sand-100">{label}</p>
      <p className="mt-1 text-xs leading-relaxed text-brand-500 dark:text-brand-100/80">{blurb}</p>
      <span className="mt-3 rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-ink-900 dark:text-sand-100">
        {count} {count === 1 ? 'item' : 'items'}
      </span>
    </button>
  );
}

function ReferenceShelfList({ references, emptyLabel }: { references: ReferenceDoc[]; emptyLabel: string }) {
  if (references.length === 0) {
    return <p className="mt-6 text-sm text-brand-500 dark:text-brand-100">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-6 divide-y divide-brand-100 overflow-hidden rounded-2xl border border-brand-100 bg-white dark:divide-ink-800 dark:border-ink-800 dark:bg-ink-950">
      {references.map((ref) => (
        <li key={ref.$id} className="flex items-start gap-4 p-4 sm:p-5">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand-100 text-brand-500 dark:bg-ink-900 dark:text-sand-100">
            {shelfOf(ref) === UNCATEGORIZED ? (
              <FolderIcon className="h-4 w-4" />
            ) : (
              (() => {
                const Icon = SHELVES[shelfOf(ref) as ReferenceCategory].icon;
                return <Icon className="h-4 w-4" />;
              })()
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-medium text-brand-700 dark:text-sand-100">{ref.title}</p>
            <p className="mt-0.5 text-sm text-brand-500 dark:text-brand-100">
              {[ref.category, ref.publisher, ref.year].filter(Boolean).join(' · ')}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-4 text-sm">
              {ref.fileId && (
                <>
                  <a
                    href={getFileViewUrl(BUCKETS.media, ref.fileId)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-sand-100"
                  >
                    View{ref.fileName ? ` "${ref.fileName}"` : ' file'}
                  </a>
                  <a
                    href={getFileDownloadUrl(BUCKETS.media, ref.fileId)}
                    className="inline-flex items-center gap-1.5 font-medium text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-sand-100"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Download
                  </a>
                </>
              )}
              {ref.url && (
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-sand-100"
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  Visit source
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
