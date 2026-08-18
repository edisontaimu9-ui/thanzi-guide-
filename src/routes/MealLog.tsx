import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { searchFoods, ChakudyaFood } from '@/lib/chakudya';
import { logMeal, listMealLogsForDay, deleteMealLog, MealLogDoc, MealType, MEAL_TYPES } from '@/lib/mealLog';

export function MealLog() {
  useDocumentTitle('Meal log');
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<MealLogDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [showForm, setShowForm] = useState(false);

  const today = new Date();

  async function refresh() {
    if (!user) return;
    try {
      const results = await listMealLogsForDay(user.$id, today);
      setLogs(results);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    if (!user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleDelete(id: string) {
    setLogs((l) => l.filter((log) => log.$id !== id));
    try {
      await deleteMealLog(id);
    } catch {
      refresh();
    }
  }

  const totals = logs.reduce(
    (acc, log) => ({
      kcal: acc.kcal + (log.kcal ?? 0),
      proteinG: acc.proteinG + (log.proteinG ?? 0),
      carbsG: acc.carbsG + (log.carbsG ?? 0),
      fatG: acc.fatG + (log.fatG ?? 0)
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  if (!authLoading && !user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Meal log</h1>
        <p className="mt-2 text-brand-500 dark:text-brand-100">
          Sign in to keep a daily food diary and track what you've eaten.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Meal log</h1>
        <span className="text-sm text-brand-300 dark:text-brand-100">
          {today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2 rounded-lg border border-brand-100 bg-white p-4 text-center dark:border-ink-800 dark:bg-ink-950">
        <Total label="kcal" value={Math.round(totals.kcal)} />
        <Total label="protein" value={`${Math.round(totals.proteinG)}g`} />
        <Total label="carbs" value={`${Math.round(totals.carbsG)}g`} />
        <Total label="fat" value={`${Math.round(totals.fatG)}g`} />
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + Log a food
        </button>
      ) : (
        <LogMealForm
          userId={user!.$id}
          onLogged={() => {
            setShowForm(false);
            refresh();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mt-8 space-y-2">
        {status === 'loading' &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950" />
          ))}

        {status === 'error' && <p className="text-sm text-clay-500 dark:text-clay-400">Couldn't load your log right now.</p>}

        {status === 'idle' && logs.length === 0 && (
          <p className="text-sm text-brand-300 dark:text-brand-100">Nothing logged today yet.</p>
        )}

        {status === 'idle' &&
          logs.map((log) => (
            <div
              key={log.$id}
              className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
            >
              <div>
                <p className="font-medium text-brand-700 dark:text-sand-50">{log.foodName}</p>
                <p className="text-xs text-brand-300 dark:text-brand-100">
                  {log.mealType} · {Math.round(log.kcal ?? 0)} kcal
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(log.$id)}
                className="text-xs font-medium text-clay-500 hover:underline dark:text-clay-400"
              >
                Remove
              </button>
            </div>
          ))}
      </div>
    </main>
  );
}

function Total({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="font-mono text-base font-semibold text-brand-700 dark:text-sand-50">{value}</dt>
      <dd className="text-[11px] uppercase tracking-wide text-brand-300 dark:text-brand-100">{label}</dd>
    </div>
  );
}

function LogMealForm({ userId, onLogged, onCancel }: { userId: string; onLogged: () => void; onCancel: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChakudyaFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ChakudyaFood | null>(null);
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      searchFoods({ search: query, limit: 8 })
        .then(setResults)
        .catch(() => setError('Search failed — try again.'))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await logMeal({ userId, food: selected, mealType });
      onLogged();
    } catch {
      setError("Couldn't save that log — try again.");
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
      {!selected ? (
        <>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a food, e.g. nsima"
            className="w-full rounded-md border border-brand-100 px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
          {searching && <p className="mt-2 text-xs text-brand-300 dark:text-brand-100">Searching…</p>}
          {results.length > 0 && (
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {results.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setSelected(food)}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-sand-100 dark:hover:bg-ink-900"
                >
                  <span className="text-brand-700 dark:text-sand-50">{food.food_name}</span>{' '}
                  <span className="text-xs text-brand-300 dark:text-brand-100">· {food.kcal} kcal</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm font-medium text-brand-700 dark:text-sand-50">{selected.food_name}</p>
          <p className="text-xs text-brand-300 dark:text-brand-100">{selected.kcal} kcal per {selected.measure}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  mealType === type
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-brand-100 text-brand-700 dark:border-ink-800 dark:text-sand-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Log it'}
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-md border border-brand-100 px-4 py-2 text-sm text-brand-700 dark:border-ink-800 dark:text-sand-50"
            >
              Back
            </button>
          </div>
        </>
      )}

      {error && <p className="mt-2 text-xs text-clay-500 dark:text-clay-400">{error}</p>}

      {!selected && (
        <button type="button" onClick={onCancel} className="mt-3 text-xs font-medium text-brand-300 hover:underline dark:text-brand-100">
          Cancel
        </button>
      )}
    </div>
  );
}
