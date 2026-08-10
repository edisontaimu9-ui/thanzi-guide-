import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useFavorites } from '@/hooks/useFavorites';
import { getFood, ChakudyaFood } from '@/lib/chakudya';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { favorites, loaded } = useFavorites();
  const [foods, setFoods] = useState<ChakudyaFood[]>([]);
  const [foodsStatus, setFoodsStatus] = useState<'loading' | 'idle' | 'error'>('loading');

  useEffect(() => {
    if (!loaded) return;
    if (favorites.length === 0) {
      setFoods([]);
      setFoodsStatus('idle');
      return;
    }
    setFoodsStatus('loading');
    Promise.all(favorites.map((f) => getFood(Number(f.foodId))))
      .then((results) => {
        setFoods(results);
        setFoodsStatus('idle');
      })
      .catch(() => setFoodsStatus('error'));
  }, [loaded, favorites]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-700">Welcome, {user?.name || 'friend'}</h1>
        <button onClick={() => logout()} className="text-sm text-brand-500 underline">
          Log out
        </button>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg text-brand-700">Favorite foods</h2>

        {!loaded || foodsStatus === 'loading' ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-brand-100 bg-white" />
            ))}
          </div>
        ) : foodsStatus === 'error' ? (
          <p className="mt-3 text-sm text-clay-500">Couldn't load your favorites right now.</p>
        ) : foods.length === 0 ? (
          <div className="mt-3 rounded-lg border border-brand-100 p-6 text-brand-500">
            <p>No favorite foods yet.</p>
            <Link to="/foods" className="mt-2 inline-block text-sm font-medium text-brand-700 underline">
              Browse foods to add some
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {foods.map((food) => (
              <Link
                key={food.id}
                to={`/foods/${food.id}`}
                className="rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500"
              >
                <p className="font-medium text-brand-700">{food.food_name}</p>
                <p className="text-xs text-brand-300">{food.category}</p>
                <p className="mt-2 font-mono text-sm text-brand-500">{food.kcal} kcal</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-brand-700">Learning progress</h2>
        <div className="mt-3 rounded-lg border border-brand-100 p-6 text-brand-500">
          <p>Courses aren't built yet — this will show your progress once they are.</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg text-brand-700">Saved articles</h2>
        <div className="mt-3 rounded-lg border border-brand-100 p-6 text-brand-500">
          <p>Articles aren't built yet — bookmarked ones will show here.</p>
        </div>
      </section>
    </main>
  );
}
