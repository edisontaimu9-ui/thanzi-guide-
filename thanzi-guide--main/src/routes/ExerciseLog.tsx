import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { estimateCalories, ActivityEstimate } from '@/lib/activityCalories';
import { logExercise, listExerciseLogsForDay, deleteExerciseLog, ExerciseLogDoc } from '@/lib/exerciseLog';

export function ExerciseLog() {
  useDocumentTitle('Exercise log');
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<ExerciseLogDoc[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [showForm, setShowForm] = useState(false);

  const today = new Date();

  async function refresh() {
    if (!user) return;
    try {
      const results = await listExerciseLogsForDay(user.$id, today);
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
      await deleteExerciseLog(id);
    } catch {
      refresh();
    }
  }

  const totalKcal = logs.reduce((sum, log) => sum + log.kcalBurned, 0);
  const totalMin = logs.reduce((sum, log) => sum + log.durationMin, 0);

  if (!authLoading && !user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Exercise log</h1>
        <p className="mt-2 text-brand-500 dark:text-brand-100">Sign in to track your activity and calories burned.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Exercise log</h1>
        <span className="text-sm text-brand-300 dark:text-brand-100">
          {today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-brand-100 bg-white p-4 text-center dark:border-ink-800 dark:bg-ink-950">
        <Total label="kcal burned" value={totalKcal} />
        <Total label="minutes" value={totalMin} />
      </div>

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="mt-4 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          + Log activity
        </button>
      ) : (
        <LogExerciseForm
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

        {status === 'idle' && logs.length === 0 && <p className="text-sm text-brand-300 dark:text-brand-100">Nothing logged today yet.</p>}

        {status === 'idle' &&
          logs.map((log) => (
            <div
              key={log.$id}
              className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
            >
              <div>
                <p className="font-medium text-brand-700 dark:text-sand-50">{log.activityName}</p>
                <p className="text-xs text-brand-300 dark:text-brand-100">
                  {log.durationMin} min · {log.kcalBurned} kcal
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

      <p className="mt-8 text-xs text-brand-500 dark:text-brand-100">
        Calorie estimates use a published reference table (Krause & Mahan Appendix 10) adjusted for your body
        weight — an estimate, not an exact measurement. Actual burn varies with fitness level, effort, and
        conditions.
      </p>
    </main>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="font-mono text-base font-semibold text-brand-700 dark:text-sand-50">{value}</dt>
      <dd className="text-[11px] uppercase tracking-wide text-brand-300 dark:text-brand-100">{label}</dd>
    </div>
  );
}

function LogExerciseForm({ userId, onLogged, onCancel }: { userId: string; onLogged: () => void; onCancel: () => void }) {
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [weight, setWeight] = useState('');
  const [estimate, setEstimate] = useState<ActivityEstimate | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const durationMin = Number(duration);
    const weightKg = Number(weight);
    if (!description.trim() || !durationMin || durationMin <= 0) {
      setEstimate(undefined);
      return;
    }
    const timer = setTimeout(() => {
      setEstimate(estimateCalories(description, durationMin, weightKg || undefined));
    }, 250);
    return () => clearTimeout(timer);
  }, [description, duration, weight]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!estimate) return;
    setSaving(true);
    setError('');
    try {
      await logExercise({ userId, activityName: estimate.name, durationMin: Number(duration), kcalBurned: estimate.calories });
      onLogged();
    } catch {
      setError("Couldn't save that log — try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
      <label htmlFor="activity-desc" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
        What did you do?
      </label>
      <input
        id="activity-desc"
        autoFocus
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. jogged, cycling fast, football"
        className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
      />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Minutes
          </label>
          <input
            id="duration"
            type="number"
            inputMode="numeric"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 text-sm text-brand-700 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>
        <div>
          <label htmlFor="ex-weight" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Your weight (kg)
          </label>
          <input
            id="ex-weight"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="optional"
            className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:border-brand-500 focus:outline-none dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>
      </div>

      {description.trim() && estimate === null && (
        <p className="mt-3 text-xs text-clay-500 dark:text-clay-400">
          Couldn't match that activity — try a simpler term like "walking", "swimming", or "weight training".
        </p>
      )}

      {estimate && (
        <div className="mt-3 rounded-md bg-sand-100 px-3 py-2 text-sm text-brand-700 dark:bg-ink-900 dark:text-sand-50">
          {estimate.name} for {duration} min ≈ <span className="font-semibold">{estimate.calories} kcal</span>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-clay-500 dark:text-clay-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={!estimate || saving}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Log it'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-brand-100 px-4 py-2 text-sm text-brand-700 dark:border-ink-800 dark:text-sand-50">
          Cancel
        </button>
      </div>
    </form>
  );
}
