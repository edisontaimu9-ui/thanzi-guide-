import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listAppointmentsForProvider, getSlot, AppointmentDoc, SlotDoc, ProviderDoc } from '@/lib/providers';

type Status = 'loading' | 'idle' | 'error';

export function ProviderInbox({ provider }: { provider: ProviderDoc }) {
  useDocumentTitle('Provider Inbox');
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [slotById, setSlotById] = useState<Record<string, SlotDoc>>({});
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    setStatus('loading');
    listAppointmentsForProvider(provider.$id)
      .then(async (appts) => {
        setAppointments(appts);
        const slots = await Promise.all(appts.map((a) => getSlot(a.slotId)));
        const map: Record<string, SlotDoc> = {};
        appts.forEach((a, i) => {
          const s = slots[i];
          if (s) map[a.$id] = s;
        });
        setSlotById(map);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [provider.$id]);

  const sorted = [...appointments].sort((a, b) => {
    const ta = slotById[a.$id]?.startTime ?? '';
    const tb = slotById[b.$id]?.startTime ?? '';
    return tb.localeCompare(ta);
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Your Appointments</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">Messages from patients you're booked with.</p>

      {status === 'loading' && <p className="mt-8 text-brand-500 dark:text-brand-100">Loading…</p>}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load your appointments right now.
        </p>
      )}
      {status === 'idle' && sorted.length === 0 && (
        <p className="mt-8 text-brand-500 dark:text-brand-100">No appointments booked yet.</p>
      )}

      {status === 'idle' && sorted.length > 0 && (
        <ul className="mt-6 space-y-2">
          {sorted.map((appt) => {
            const slot = slotById[appt.$id];
            return (
              <li key={appt.$id}>
                <Link
                  to={`/appointments/${appt.$id}/messages`}
                  className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-4 hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950"
                >
                  <div>
                    <p className="font-medium text-brand-700 dark:text-sand-100">{appt.patientName}</p>
                    <p className="text-xs text-brand-300 dark:text-brand-100">
                      {slot
                        ? new Intl.DateTimeFormat('en', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          }).format(new Date(slot.startTime))
                        : 'Time unavailable'}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-brand-500 dark:text-brand-100">Message →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
