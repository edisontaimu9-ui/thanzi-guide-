import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getAppointment, getProvider, getProviderByUserId, getSlot, AppointmentDoc, ProviderDoc, SlotDoc } from '@/lib/providers';
import { MessageThread } from '@/components/MessageThread';
import type { SenderRole } from '@/lib/messages';
import { LoadingRunner } from '@/components/LoadingRunner';

type Status = 'loading' | 'idle' | 'error' | 'forbidden';

export function AppointmentThread() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  useDocumentTitle('Messages');

  const [appointment, setAppointment] = useState<AppointmentDoc | null>(null);
  const [provider, setProvider] = useState<ProviderDoc | null>(null);
  const [slot, setSlot] = useState<SlotDoc | null>(null);
  const [myRole, setMyRole] = useState<SenderRole | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!id || !user) return;
    setStatus('loading');

    async function load() {
      const appt = await getAppointment(id!);
      if (!appt) {
        setStatus('error');
        return;
      }
      const [providerDoc, slotDoc, myProviderDoc] = await Promise.all([
        getProvider(appt.providerId),
        getSlot(appt.slotId),
        getProviderByUserId(user!.$id)
      ]);

      const isPatient = appt.userId === user!.$id;
      const isProvider = !!myProviderDoc && myProviderDoc.$id === appt.providerId;

      if (!isPatient && !isProvider) {
        setStatus('forbidden');
        return;
      }
      if (!providerDoc?.userId) {
        // Provider isn't linked to a login yet — nobody to message.
        setStatus('error');
        return;
      }

      setAppointment(appt);
      setProvider(providerDoc);
      setSlot(slotDoc);
      setMyRole(isProvider ? 'provider' : 'patient');
      setStatus('idle');
    }

    load().catch(() => setStatus('error'));
  }, [id, user]);

  const backHref = myRole === 'provider' ? '/provider' : '/dashboard';

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to={backHref} className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Back
      </Link>

      {status === 'loading' && <LoadingRunner className="mt-6" />}
      {status === 'error' && (
        <p role="alert" className="mt-6 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load this conversation right now.
        </p>
      )}
      {status === 'forbidden' && (
        <p className="mt-6 text-brand-700 dark:text-sand-100">This conversation isn't available to you.</p>
      )}

      {status === 'idle' && appointment && provider && myRole && (
        <>
          <h1 className="mt-4 font-display text-2xl text-brand-700 dark:text-sand-100">
            {myRole === 'provider' ? appointment.patientName : provider.name}
          </h1>
          {slot && (
            <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
              {new Intl.DateTimeFormat('en', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              }).format(new Date(slot.startTime))}
            </p>
          )}

          <div className="mt-6">
            <MessageThread
              appointmentId={appointment.$id}
              currentUserId={user!.$id}
              currentRole={myRole}
              recipientUserId={myRole === 'provider' ? appointment.userId : provider.userId}
              isClosed={isThreadClosed(slot)}
              closedReason="This appointment has passed, the conversation is now closed."
            />
          </div>
        </>
      )}
    </main>
  );
}

function isThreadClosed(slot: SlotDoc | null): boolean {
  if (!slot) return false;
  const end = new Date(slot.startTime).getTime() + (slot.durationMinutes ?? 30) * 60_000;
  return Date.now() > end;
}
