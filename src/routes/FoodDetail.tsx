import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFood, ChakudyaFood } from '@/lib/chakudya';

export function FoodDetail() {
  const { id } = useParams<{ id: string }>();
  const [food, setFood] = useState<ChakudyaFood | null>(null);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/foods" className="text-sm text-brand-500 underline">
        ← Back to foods
      </Link>

      {status === 'loading' && (
        <div className="mt-6 animate-pulse space-y-3" aria-hidden="true">
          <div className="h-8 w-2/3 rounded bg-brand-100" />
          <div className="h-4 w-1/3 rounded bg-brand-100" />
          <div className="h-24 rounded bg-brand-100" />
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="mt-6 rounded-md border border-clay-400 bg-clay-400/10 p-4 text-clay-500">
          {errorMessage}
        </div>
      )}

      {status === 'idle' && food && (
        <>
          <h1 className="mt-6 font-display text-3xl text-brand-700">{food.food_name}</h1>
          <p className="mt-1 text-brand-500">
            {food.category} · {food.measure}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <NutrientStat label="Calories" value={`${food.kcal} kcal`} />
            <NutrientStat label="Protein" value={`${food.protein_g} g`} />
            <NutrientStat label="Carbs" value={`${food.carbs_g} g`} />
            <NutrientStat label="Fat" value={`${food.fat_g} g`} />
          </dl>
          <p className="mt-4 text-xs text-brand-300">
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
    <div className="rounded-lg border border-brand-100 p-4 text-center">
      <dt className="text-xs uppercase tracking-wide text-brand-300">{label}</dt>
      <dd className="mt-1 font-display text-xl text-brand-700">{value}</dd>
    </div>
  );
}
