import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  listUpcomingSlots,
  listBookedSlotIds,
  createSlot,
  deleteSlot,
  isSlotBooked,
  SlotDoc,
  ProviderDoc
} from '@/lib/providers';

type Status = 'loading' | 'idle' | 'error';

export function ProviderSlots({ provider }: { provider: ProviderDoc }) {
  useDocumentTitle('Manage Slots');
  const { user } = useAuth();

  const [slots, setSlots] = useState<SlotDoc[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>('loading');

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function load() {
    setStatus('loading');
    try {
      const [slotResults, booked] = await Promise.all([
        listUpcomingSlots(provider.$id),
        listBookedSlotIds(provider.$id)
      ]);
      setSlots(slotResults.sort((a, b) => a.startTime.localeCompare(b.startTime)));
      setBookedIds(booked);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.$id]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !date || !time) return;
    setFormError(null);

    const startTime = new Date(`${date}T${time}`);
    if (Number.isNaN(startTime.getTime())) {
      setFormError('Enter a valid date and time.');
      return;
    }
    if (startTime.getTime() < Date.now()) {
      setFormError("That time is in the past, pick a time that's still ahead.");
      return;
    }

    setCreating(true);
    try {
      await createSlot({
        providerId: provider.$id,
        createdByUserId: user.$id,
        startTime: startTime.toISOString(),
        durationMinutes: Number(duration) || 30,
        notes
      });
      setDate('');
      setTime('');
      setNotes('');
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not add that slot. Try again.');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(slot: SlotDoc) {
    if (bookedIds.has(slot.$id)) {
      alert("This slot is booked — can't delete it. Message the patient if you need to reschedule.");
      return;
    }
    if (!confirm('Remove this open slot?')) return;

    setPendingDeleteId(slot.$id);
    try {
      const booked = await isSlotBooked(slot.$id);
      if (booked) {
        alert("This slot was just booked — can't delete it now.");
        await load();
        return;
      }
      await deleteSlot(slot.$id);
      await load();
    } catch {
      alert('Could not delete that slot. Try again.');
    } finally {
      setPendingDeleteId(null);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link to="/provider" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Your Appointments
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-700 dark:text-sand-100">Manage Availability</h1>
      <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
        Add open times patients can book, or remove ones you no longer want open.
      </p>

      <form onSubmit={handleCreate} className="mt-6 space-y-4 rounded-lg border border-brand-100 p-4 dark:border-ink-800">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Duration (minutes)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          >
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="45">45</option>
            <option value="60">60</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Video call only"
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>

        {formError && (
          <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {creating ? 'Adding…' : 'Add Slot'}
        </button>
      </form>

      <h2 className="mt-8 font-display text-lg text-brand-700 dark:text-sand-100">Upcoming Slots</h2>

      {status === 'loading' && <p className="mt-4 text-brand-500 dark:text-brand-100">Loading…</p>}
      {status === 'error' && (
        <p role="alert" className="mt-4 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load your slots right now.
        </p>
      )}
      {status === 'idle' && slots.length === 0 && (
        <p className="mt-4 text-brand-500 dark:text-brand-100">No upcoming slots yet, add one above.</p>
      )}

      {status === 'idle' && slots.length > 0 && (
        <ul className="mt-4 space-y-2">
          {slots.map((slot) => {
            const booked = bookedIds.has(slot.$id);
            return (
              <li
                key={slot.$id}
                className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-950"
              >
                <div>
                  <p className="text-sm font-medium text-brand-700 dark:text-sand-100">
                    {new Intl.DateTimeFormat('en', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    }).format(new Date(slot.startTime))}
                    <span className="ml-2 text-xs text-brand-300 dark:text-brand-100">
                      {slot.durationMinutes ?? 30} min
                    </span>
                  </p>
                  {slot.notes && <p className="text-xs text-brand-300 dark:text-brand-100">{slot.notes}</p>}
                  {booked && (
                    <span className="mt-1 inline-block rounded bg-clay-400/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-clay-500 dark:text-clay-400">
                      Booked
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(slot)}
                  disabled={pendingDeleteId === slot.$id}
                  className="text-sm font-medium text-clay-500 underline hover:text-clay-400 disabled:opacity-50 dark:text-clay-400"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
