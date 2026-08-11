import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  bookSlot,
  getProvider,
  listBookedSlotIds,
  listUpcomingSlots,
  ProviderDoc,
  SlotDoc
} from '@/lib/providers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [provider, setProvider] = useState<ProviderDoc | null>(null);
  const [slots, setSlots] = useState<SlotDoc[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'loading' | 'idle' | 'error' | 'not-found'>('loading');

  const [selectedSlot, setSelectedSlot] = useState<SlotDoc | null>(null);
  const [patientName, setPatientName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useDocumentTitle(provider ? `Book with ${provider.name}` : 'Find a provider');

  useEffect(() => {
    if (!id) return;
    setStatus('loading');
    Promise.all([getProvider(id), listUpcomingSlots(id), listBookedSlotIds(id)])
      .then(([providerDoc, slotDocs, booked]) => {
        if (!providerDoc) {
          setStatus('not-found');
          return;
        }
        setProvider(providerDoc);
        setSlots(slotDocs);
        setBookedIds(booked);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  useEffect(() => {
    if (user) setPatientName(user.name);
  }, [user]);

  function openBookingFor(slot: SlotDoc) {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedSlot(slot);
    setBookingError(null);
    setConfirmed(false);
  }

  async function handleConfirm(e: FormEvent) {
    e.preventDefault();
    if (!user || !provider || !selectedSlot) return;
    setSubmitting(true);
    setBookingError(null);
    try {
      await bookSlot(
        user.$id,
        provider.$id,
        selectedSlot.$id,
        patientName,
        reason,
        provider.name,
        formatFull(selectedSlot.startTime)
      );
      setBookedIds((prev) => new Set(prev).add(selectedSlot.$id));
      setConfirmed(true);
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : 'Could not book that slot — it may have just been taken.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return <p className="mx-auto max-w-2xl px-6 py-12 text-brand-500 dark:text-brand-100">Loading…</p>;
  }

  if (status === 'not-found') {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-brand-500 dark:text-brand-100">That provider couldn't be found.</p>
        <Link to="/care" className="mt-2 inline-block text-sm font-medium text-brand-700 underline dark:text-sand-50">
          Back to all providers
        </Link>
      </main>
    );
  }

  if (status === 'error' || !provider) {
    return <p className="mx-auto max-w-2xl px-6 py-12 text-sm text-clay-500 dark:text-clay-400">Something went wrong loading this page.</p>;
  }

  const availableSlots = slots.filter((s) => !bookedIds.has(s.$id));
  const grouped = groupByDay(availableSlots);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/care" className="text-sm font-medium text-brand-500 underline dark:text-brand-100">
        ← All providers
      </Link>

      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-2xl text-white">
          {provider.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl text-brand-700 dark:text-sand-50">{provider.name}</h1>
          <p className="text-sm text-brand-500 dark:text-brand-100">{provider.title}</p>
          {provider.specialty && <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">{provider.specialty}</p>}
          {provider.location && <p className="mt-1 text-xs text-brand-300 dark:text-brand-100">{provider.location}</p>}
        </div>
      </div>

      {provider.bio && <p className="mt-5 text-sm text-brand-700 dark:text-sand-100">{provider.bio}</p>}

      {(provider.phone || provider.whatsapp) && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="font-medium text-brand-700 underline dark:text-sand-50">
              Call {provider.phone}
            </a>
          )}
          {provider.whatsapp && (
            <a
              href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-700 underline dark:text-sand-50"
            >
              WhatsApp
            </a>
          )}
        </div>
      )}

      <h2 className="mt-8 font-display text-lg text-brand-700 dark:text-sand-100">Available times</h2>

      {availableSlots.length === 0 ? (
        <p className="mt-3 text-brand-500 dark:text-brand-100">No open slots right now — check back soon.</p>
      ) : (
        <div className="mt-3 space-y-5">
          {grouped.map(([day, daySlots]) => (
            <div key={day}>
              <p className="text-xs font-medium uppercase tracking-wide text-brand-300 dark:text-brand-100">{day}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <button
                    key={slot.$id}
                    onClick={() => openBookingFor(slot)}
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                      selectedSlot?.$id === slot.$id
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-brand-100 text-brand-700 hover:border-brand-500 dark:border-brand-700 dark:text-sand-100'
                    }`}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSlot && !confirmed && (
        <form
          onSubmit={handleConfirm}
          className="mt-6 space-y-4 rounded-lg border border-brand-100 bg-white p-5 dark:border-brand-700 dark:bg-brand-900"
        >
          <p className="text-sm text-brand-700 dark:text-sand-100">
            Booking <span className="font-semibold">{formatFull(selectedSlot.startTime)}</span> with {provider.name}
          </p>
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
              Name for the appointment
            </label>
            <input
              id="patientName"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-sand-50"
            />
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
              What's this about? (optional)
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-sand-50"
            />
          </div>
          {bookingError && <p className="text-sm text-clay-500 dark:text-clay-400">{bookingError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlot(null)}
              className="rounded-md px-4 py-2 text-sm font-medium text-brand-500 dark:text-brand-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {confirmed && selectedSlot && (
        <div className="mt-6 rounded-lg border border-brand-500 bg-brand-50 p-5 text-brand-700 dark:bg-brand-700 dark:text-sand-50">
          <p className="font-medium">Booked — {formatFull(selectedSlot.startTime)} with {provider.name}.</p>
          <p className="mt-1 text-sm">
            You'll find this in your{' '}
            <Link to="/dashboard" className="underline">
              account
            </Link>
            .
          </p>
        </div>
      )}
    </main>
  );
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

function formatFull(iso: string): string {
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(iso));
}

function groupByDay(slots: SlotDoc[]): [string, SlotDoc[]][] {
  const map = new Map<string, SlotDoc[]>();
  for (const slot of slots) {
    const day = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(
      new Date(slot.startTime)
    );
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(slot);
  }
  return Array.from(map.entries());
}
