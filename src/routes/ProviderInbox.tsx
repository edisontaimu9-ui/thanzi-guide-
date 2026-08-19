import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  listAppointmentsForProvider,
  getSlot,
  updateAppointmentStatus,
  AppointmentDoc,
  AppointmentAction,
  SlotDoc,
  ProviderDoc
} from '@/lib/providers';
import { LoadingRunner } from '@/components/LoadingRunner';

type Status = 'loading' | 'idle' | 'error';

// Undefined/'booked' collapse to the same "Pending" label — appointments
// created before Phase 1's schema migration have no status field at all,
// and the backfill script (scripts/migrate-backfill-appointment-status.mjs)
// treats that the same way: not an error state, just "not yet acted on."
const STATUS_LABEL: Record<string, string> = {
  booked: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Declined',
  rescheduled: 'Awaiting new time',
  cancelled: 'Cancelled'
};

const STATUS_STYLE: Record<string, string> = {
  booked: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
  confirmed: 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200',
  rejected: 'bg-clay-400/10 text-clay-500 dark:bg-clay-950/30 dark:text-clay-400',
  rescheduled: 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200',
  cancelled: 'bg-brand-100 text-brand-500 dark:bg-ink-800 dark:text-brand-100'
};

// Which actions functions/appointment-action will actually allow a
// provider to take from a given status — mirrors that function's
// ACTION_STATUS/terminal-state check. Kept here purely to decide which
// buttons to render; the function itself is still the real authority.
function availableActions(status: string): AppointmentAction[] {
  if (status === 'confirmed' || status === 'rescheduled') return ['cancel'];
  if (status === 'rejected' || status === 'cancelled') return [];
  return ['confirm', 'reject', 'reschedule', 'cancel']; // booked / no status yet
}

const ACTION_LABEL: Record<AppointmentAction, string> = {
  confirm: 'Confirm',
  reject: 'Decline',
  reschedule: 'Ask to reschedule',
  cancel: 'Cancel'
};

const ACTION_BUSY_LABEL: Record<AppointmentAction, string> = {
  confirm: 'Confirming…',
  reject: 'Declining…',
  reschedule: 'Requesting…',
  cancel: 'Cancelling…'
};

const ACTION_STYLE: Record<AppointmentAction, string> = {
  confirm: 'text-green-700 hover:text-green-600 dark:text-green-300',
  reject: 'text-clay-500 hover:text-clay-400',
  reschedule: 'text-brand-500 hover:text-brand-400 dark:text-brand-100',
  cancel: 'text-clay-500 hover:text-clay-400'
};

export function ProviderInbox({ provider }: { provider: ProviderDoc }) {
  useDocumentTitle('Provider Inbox');
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [slotById, setSlotById] = useState<Record<string, SlotDoc>>({});
  const [status, setStatus] = useState<Status>('loading');
  // Track appointment + which specific action, so only the button the
  // provider actually clicked shows a busy label — the other buttons in
  // that row just disable.
  const [actingId, setActingId] = useState<string | null>(null);
  const [actingAction, setActingAction] = useState<AppointmentAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  async function handleAction(appointmentId: string, action: AppointmentAction) {
    setActingId(appointmentId);
    setActingAction(action);
    setActionError(null);
    try {
      const newStatus = await updateAppointmentStatus(appointmentId, action);
      setAppointments((prev) =>
        prev.map((a) => (a.$id === appointmentId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setActingId(null);
      setActingAction(null);
    }
  }

  const sorted = [...appointments].sort((a, b) => {
    const ta = slotById[a.$id]?.startTime ?? '';
    const tb = slotById[b.$id]?.startTime ?? '';
    return tb.localeCompare(ta);
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Your Appointments</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">Messages from patients you're booked with.</p>
      <Link to="/provider/profile" className="mt-2 inline-block text-sm text-brand-500 underline dark:text-brand-100">
        Edit your profile
      </Link>
      <Link to="/provider/slots" className="mt-2 block text-sm text-brand-500 underline dark:text-brand-100">
        Manage your availability
      </Link>

      {status === 'loading' && <LoadingRunner className="mt-8" />}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load your appointments right now.
        </p>
      )}
      {actionError && (
        <p role="alert" className="mt-4 text-sm text-clay-500 dark:text-clay-400">
          {actionError}
        </p>
      )}
      {status === 'idle' && sorted.length === 0 && (
        <p className="mt-8 text-brand-500 dark:text-brand-100">No appointments booked yet.</p>
      )}

      {status === 'idle' && sorted.length > 0 && (
        <ul className="mt-6 space-y-2">
          {sorted.map((appt) => {
            const slot = slotById[appt.$id];
            const apptStatus = appt.status ?? 'booked';
            const actions = availableActions(apptStatus);
            const isActing = actingId === appt.$id;
            return (
              <li
                key={appt.$id}
                className="rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
              >
                <div className="flex items-center justify-between gap-4">
                  <Link
                    to={`/appointments/${appt.$id}/messages`}
                    className="min-w-0 flex-1 hover:opacity-80"
                  >
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-brand-700 dark:text-sand-100">{appt.patientName}</p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[apptStatus] ?? STATUS_STYLE.booked}`}
                      >
                        {STATUS_LABEL[apptStatus] ?? STATUS_LABEL.booked}
                      </span>
                    </div>
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
                  </Link>
                  <span className="shrink-0 text-sm font-medium text-brand-500 dark:text-brand-100">Message →</span>
                </div>

                {actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-brand-100 pt-3 dark:border-ink-800">
                    {actions.map((action) => (
                      <button
                        key={action}
                        onClick={() => handleAction(appt.$id, action)}
                        disabled={isActing}
                        className={`text-sm font-medium underline disabled:opacity-60 ${ACTION_STYLE[action]}`}
                      >
                        {isActing && actingAction === action ? ACTION_BUSY_LABEL[action] : ACTION_LABEL[action]}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
