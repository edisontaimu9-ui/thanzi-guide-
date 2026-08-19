import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  generate,
  getRateRange,
  NutritionPlan,
  Sex,
  ActivityLevel,
  Goal,
  SportType
} from '@/lib/nutritionEngine';

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary — little to no exercise' },
  { value: 'low_active', label: 'Low active — light exercise 1–3 days/week' },
  { value: 'active', label: 'Active — moderate exercise most days' },
  { value: 'very_active', label: 'Very active — hard exercise daily' }
];

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain weight' },
  { value: 'gain', label: 'Gain weight' }
];

const SPORT_OPTIONS: { value: SportType; label: string }[] = [
  { value: 'endurance', label: 'Endurance (running, cycling, swimming)' },
  { value: 'strength', label: 'Strength / resistance training' },
  { value: 'team_sport', label: 'Team sport (football, netball)' },
  { value: 'power', label: 'Power (sprinting, jumping, throwing)' },
  { value: 'recreational', label: 'Recreational / general fitness' }
];

export function EnergyEstimator() {
  useDocumentTitle('Energy Estimator');
  const [sex, setSex] = useState<Sex>('F');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [rate, setRate] = useState<number | undefined>(undefined);
  const [trainsForSport, setTrainsForSport] = useState(false);
  const [sportType, setSportType] = useState<SportType>('recreational');
  const [sessionMin, setSessionMin] = useState('60');
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [error, setError] = useState('');

  const rateRange = getRateRange(goal, sex);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const weightKg = Number(weight);
    const heightCm = Number(height);
    const ageYears = Number(age);

    if (!weightKg || !heightCm || !ageYears || weightKg <= 0 || heightCm <= 0 || ageYears <= 0) {
      setError('Enter a valid weight, height, and age.');
      setPlan(null);
      return;
    }
    if (ageYears < 18 || ageYears > 100) {
      setError('This calculator covers ages 18 and up.');
      setPlan(null);
      return;
    }

    const result = generate({
      age: ageYears,
      sex,
      weight_kg: weightKg,
      height_m: heightCm / 100,
      activity_level: activity,
      goal,
      rate_kg_per_week: rate,
      sport_type: trainsForSport ? sportType : undefined,
      session_min: trainsForSport ? Number(sessionMin) || 60 : undefined
    });

    if ('error' in result) {
      setError(result.error);
      setPlan(null);
      return;
    }

    setError('');
    setPlan(result);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Link to="/tools" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Back to tools
      </Link>

      <h1 className="mt-4 font-display text-3xl text-brand-700 dark:text-sand-100">Energy Estimator</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Get a personalized daily calorie target, macros, and nutrient guidance based on your goal and activity.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <span className="block text-sm font-medium text-brand-700 dark:text-sand-100">Sex</span>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-brand-700 dark:text-sand-100">
              <input type="radio" name="sex" checked={sex === 'F'} onChange={() => setSex('F')} />
              Female
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-700 dark:text-sand-100">
              <input type="radio" name="sex" checked={sex === 'M'} onChange={() => setSex('M')} />
              Male
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Age (years, 18+)
          </label>
          <input
            id="age"
            type="number"
            inputMode="numeric"
            min="18"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
            required
          />
        </div>

        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
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
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
            required
          />
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
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
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
            required
          />
        </div>

        <div>
          <label htmlFor="activity" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Activity level
          </label>
          <select
            id="activity"
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950"
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Goal
          </label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value as Goal);
              setRate(undefined);
            }}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950"
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {rateRange && (
          <div>
            <span className="block text-sm font-medium text-brand-700 dark:text-sand-100">Pace</span>
            <div className="mt-1 flex gap-2">
              {rateRange.presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setRate(p.value)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium ${
                    (rate ?? rateRange.default) === p.value
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-brand-100 text-brand-700 dark:border-ink-800 dark:text-sand-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-sand-100">
            <input type="checkbox" checked={trainsForSport} onChange={(e) => setTrainsForSport(e.target.checked)} />
            I train for a sport or regularly exercise
          </label>
          {trainsForSport && (
            <div className="mt-2 space-y-2">
              <select
                value={sportType}
                onChange={(e) => setSportType(e.target.value as SportType)}
                className="w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950"
              >
                {SPORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                value={sessionMin}
                onChange={(e) => setSessionMin(e.target.value)}
                placeholder="Typical session length (minutes)"
                className="w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
              />
            </div>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
            {error}
          </p>
        )}

        <button type="submit" className="w-full rounded-md bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-700">
          Calculate
        </button>
      </form>

      {plan && (
        <div className="mt-8 space-y-6">
          {plan.energy.goal_override && (
            <p className="rounded-md bg-clay-400/10 px-3 py-2 text-sm text-clay-500 dark:text-clay-400">
              {plan.energy.override_reason}
            </p>
          )}

          <section>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Your numbers</h2>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Stat label="BMI" value={plan.assessment.bmi} sub={plan.assessment.bmi_category} />
              <Stat label="Resting (BMR)" value={plan.assessment.bmr_kcal} sub="kcal/day" />
              <Stat label="Maintenance (EER)" value={plan.assessment.eer_kcal} sub="kcal/day" />
              <Stat label="Daily target" value={plan.energy.target_kcal} sub="kcal/day" highlight />
            </div>
            <p className="mt-2 text-xs text-brand-500 dark:text-brand-100">{plan.energy.note}</p>
          </section>

          <section>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Macros</h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <MacroStat label="Protein" g={plan.macros.protein.g} pct={plan.macros.protein.pct} />
              <MacroStat label="Carbs" g={plan.macros.carbs.g} pct={plan.macros.carbs.pct} />
              <MacroStat label="Fat" g={plan.macros.fat.g} pct={plan.macros.fat.pct} />
            </div>
            {plan.macros.amdr_flag && <p className="mt-2 text-xs text-clay-500 dark:text-clay-400">{plan.macros.amdr_flag}</p>}
          </section>

          <section>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Nutrients to watch</h2>
            <ul className="mt-2 space-y-2">
              {plan.micronutrients.flags.map((f) => (
                <li key={f.nutrient} className="rounded-lg border border-brand-100 bg-white p-3 text-sm dark:border-ink-800 dark:bg-ink-950">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-brand-700 dark:text-sand-50">{f.nutrient}</span>
                    <span className="text-xs text-brand-300 dark:text-brand-100">{f.target}</span>
                  </div>
                  <p className="mt-1 text-xs text-brand-500 dark:text-brand-100">{f.note}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Food tips for your goal</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-700 dark:text-sand-50">
              {plan.food_recommendations.practical_tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>

          {plan.modules.sports && (
            <section>
              <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Sports nutrition</h2>
              <div className="mt-2 space-y-2 text-sm">
                <p className="text-brand-700 dark:text-sand-50">
                  Protein: {plan.modules.sports.protein.min_g}–{plan.modules.sports.protein.max_g}g/day ({plan.modules.sports.protein.g_per_kg})
                </p>
                <p className="text-brand-700 dark:text-sand-50">
                  Carbs: {plan.modules.sports.carbs.min_g_day}–{plan.modules.sports.carbs.max_g_day}g/day ({plan.modules.sports.carbs.g_per_kg})
                </p>
                <p className="text-xs text-brand-500 dark:text-brand-100">
                  Post-workout: {plan.modules.sports.timing.post_workout.carbs_g} carbs + {plan.modules.sports.timing.post_workout.protein_g} protein within
                  30 min — try {plan.modules.sports.timing.post_workout.local_foods[0].toLowerCase()}.
                </p>
              </div>
            </section>
          )}

          {plan.modules.bone_health.risk_level !== 'Low' && (
            <section>
              <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Bone health</h2>
              <p className="mt-2 text-sm text-brand-700 dark:text-sand-50">{plan.modules.bone_health.recommendation}</p>
            </section>
          )}

          {plan.modules.aging && (
            <section>
              <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">For your age group</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-700 dark:text-sand-50">
                {plan.modules.aging.special_flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          )}

          {plan.modules.young_adult && (
            <section>
              <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">For your age group</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-brand-700 dark:text-sand-50">
                {plan.modules.young_adult.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <p className="mt-8 text-xs text-brand-500 dark:text-brand-100">
        This is an estimate, not a diagnosis. It's built on published equations and dietary reference intakes
        (Krause & Mahan, DRI/NASEM, ACSM) but won't be exact for everyone. Pregnancy, illness, and other
        factors change energy and nutrient needs. Talk to a health worker or registered dietitian for
        guidance specific to you.
      </p>
    </main>
  );
}

function Stat({ label, value, sub, highlight = false }: { label: string; value: number; sub: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? 'border-brand-500 bg-brand-500/5' : 'border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950'
      }`}
    >
      <p className="text-xs text-brand-500 dark:text-brand-100">{label}</p>
      <p className="font-display text-xl text-brand-700 dark:text-sand-100">{value}</p>
      <p className="text-xs text-brand-500 dark:text-brand-100">{sub}</p>
    </div>
  );
}

function MacroStat({ label, g, pct }: { label: string; g: number; pct: number }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-white p-3 text-center dark:border-ink-800 dark:bg-ink-950">
      <p className="text-xs text-brand-500 dark:text-brand-100">{label}</p>
      <p className="font-display text-lg text-brand-700 dark:text-sand-100">{g}g</p>
      <p className="text-[11px] text-brand-300 dark:text-brand-100">{pct}%</p>
    </div>
  );
}
