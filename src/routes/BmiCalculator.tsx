import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { calculateBmi, BmiResult } from '@/lib/health';

export function BmiCalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState<BmiResult | null>(null);
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const weightKg = Number(weight);
    const heightCm = Number(height);

    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
      setError('Enter a valid weight and height.');
      setResult(null);
      return;
    }

    setError('');
    setResult(calculateBmi(weightKg, heightCm));
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link to="/tools" className="text-sm text-brand-500 underline">
        ← Back to tools
      </Link>

      <h1 className="mt-4 font-display text-3xl text-brand-700">BMI Calculator</h1>
      <p className="mt-2 text-brand-500">Estimate your body mass index.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-brand-700">
            Weight (kg)
          </label>
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-brand-700">
            Height (cm)
          </label>
          <input
            id="height"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-clay-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700"
        >
          Calculate
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-lg border border-brand-100 bg-white p-5">
          <p className="text-sm text-brand-500">Your BMI</p>
          <p className="font-display text-3xl text-brand-700">{result.bmi}</p>
          <p className="mt-1 text-sm font-medium text-brand-700">{result.category}</p>
        </div>
      )}

      <p className="mt-6 text-xs text-brand-500">
        This is an estimate, not a diagnosis. BMI doesn't account for muscle mass, age, or body
        composition. Talk to a health worker or registered dietitian for guidance specific to you.
      </p>
    </main>
  );
}
