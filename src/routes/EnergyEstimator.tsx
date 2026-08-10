import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { calculateEnergy, EnergyResult, Sex, ActivityLevel, ACTIVITY_LEVELS } from '@/lib/health';

export function EnergyEstimator() {
  const [sex, setSex] = useState<Sex>('female');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [result, setResult] = useState<EnergyResult | null>(null);
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const weightKg = Number(weight);
    const heightCm = Number(height);
    const ageYears = Number(age);

    if (!weightKg || !heightCm || !ageYears || weightKg <= 0 || heightCm <= 0 || ageYears <= 0) {
      setError('Enter a valid weight, height, and age.');
      setResult(null);
      return;
    }

    setError('');
    setResult(calculateEnergy(sex, weightKg, heightCm, ageYears, activity));
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link to="/tools" className="text-sm text-brand-500 underline">
        ← Back to tools
      </Link>

      <h1 className="mt-4 font-display text-3xl text-brand-700">Energy Estimator</h1>
      <p className="mt-2 text-brand-500">Estimate your daily energy (calorie) needs.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <span className="block text-sm font-medium text-brand-700">Sex</span>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-brand-700">
              <input type="radio" name="sex" checked={sex === 'female'} onChange={() => setSex('female')} />
              Female
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-700">
              <input type="radio" name="sex" checked={sex === 'male'} onChange={() => setSex('male')} />
              Male
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-brand-700">
            Age (years)
          </label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            min="1"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>

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

        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-brand-700">
            Activity level
          </label>
          <select
            id="activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
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
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-brand-100 bg-white p-5">
            <p className="text-sm text-brand-500">Resting (BMR)</p>
            <p className="font-display text-2xl text-brand-700">{result.bmr}</p>
            <p className="text-xs text-brand-500">kcal/day</p>
          </div>
          <div className="rounded-lg border border-brand-100 bg-white p-5">
            <p className="text-sm text-brand-500">Daily needs (TDEE)</p>
            <p className="font-display text-2xl text-brand-700">{result.tdee}</p>
            <p className="text-xs text-brand-500">kcal/day</p>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-brand-500">
        This is an estimate, not a diagnosis. It uses a standard formula (Mifflin-St Jeor) and
        won't be exact for everyone — pregnancy, illness, and other factors change energy needs.
        Talk to a health worker or registered dietitian for guidance specific to you.
      </p>
    </main>
  );
}
