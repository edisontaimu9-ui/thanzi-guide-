import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getFood, ChakudyaFood } from '@/lib/chakudya';
import { useAuth } from '@/lib/auth-context';
import { useFavorites } from '@/hooks/useFavorites';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function FoodDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite, loaded: favoritesLoaded } = useFavorites();
  const [food, setFood] = useState<ChakudyaFood | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [favoritePending, setFavoritePending] = useState(false);
  useDocumentTitle(food?.food_name);

  useEffect(() => {
    if (!id) return;
    setStatus('loading');
    getFood(Number(id))
      .then((result) => {
        setFood(result);
        setStatus('idle');
      })
      .catch((err) => {
        setErrorMessage(err instanceof Error ? err.message : 'Could not load this food.');
        setStatus('error');
      });
  }, [id]);

  async function handleFavoriteClick() {
    if (!food) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setFavoritePending(true);
    try {
      await toggleFavorite(food.id);
    } finally {
      setFavoritePending(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/foods" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Back to foods
      </Link>

      {status === 'loading' && (
        <div className="mt-6 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-8 w-2/3 rounded bg-brand-100 dark:bg-ink-900" />
          <div className="h-4 w-1/3 rounded bg-brand-100 dark:bg-ink-900" />
          <div className="h-24 rounded bg-brand-100 dark:bg-ink-900" />
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="mt-6 rounded-md border border-clay-400 bg-clay-400/10 p-4 text-clay-500 dark:text-clay-400">
          {errorMessage}
        </div>
      )}

      {status === 'idle' && food && (
        <>
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">{food.food_name}</h1>
              <p className="mt-1 text-brand-500 dark:text-brand-100">
                {food.category} · {food.measure}
              </p>
            </div>
            <button
              type="button"
              onClick={handleFavoriteClick}
              disabled={favoritePending || !favoritesLoaded}
              aria-pressed={isFavorite(food.id)}
              className={`shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
                isFavorite(food.id)
                  ? 'border-clay-500 bg-clay-400/10 text-clay-500 dark:text-clay-400'
                  : 'border-brand-100 text-brand-500 hover:border-brand-500 dark:text-brand-100 dark:border-ink-800'
              }`}
            >
              {isFavorite(food.id) ? '★ Favorited' : '☆ Favorite'}
            </button>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NutrientStat label="Calories" value={`${food.kcal} kcal`} />
            <NutrientStat label="Protein" value={`${food.protein_g} g`} />
            <NutrientStat label="Carbs" value={`${food.carbs_g} g`} />
            <NutrientStat label="Fat" value={`${food.fat_g} g`} />
          </dl>
          <p className="mt-4 text-xs text-brand-300 dark:text-brand-100">
            Values are per {food.measure} ({food.weight_g}g) from the Chakudya Nutrition
            Registry — Malawi food composition data.
          </p>
        </>
      )}
    </main>
  );
}

function NutrientStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-100 p-4 text-center dark:border-ink-800">
      <dt className="text-xs uppercase tracking-wide text-brand-300 dark:text-brand-100">{label}</dt>
      <dd className="mt-1 font-mono text-xl font-semibold text-brand-700 dark:text-sand-100">{value}</dd>
    </div>
  );
}
