import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useFavorites } from '@/hooks/useFavorites';
import { getFood, ChakudyaFood } from '@/lib/chakudya';
import { listAllCompletedProgress } from '@/lib/courses';
import { AppointmentDoc, cancelAppointment, getProvider, getProviderByUserId, getSlot, listMyAppointments, ProviderDoc, SlotDoc } from '@/lib/providers';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const ROLE_LABEL: Record<string, string> = {
  USER: 'Member',
  EDITOR: 'Editor',
  NUTRITION_EXPERT: 'Nutrition Expert',
  ADMIN: 'Admin'
};

const CONTRIBUTOR_ROLES = ['EDITOR', 'NUTRITION_EXPERT', 'ADMIN'];

export function Dashboard() {
  useDocumentTitle('Your account');
  const { user, profile, logout } = useAuth();
  const { favorites, loaded } = useFavorites();
  const [foods, setFoods] = useState<ChakudyaFood[]>([]);
  const [foodsStatus, setFoodsStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [providerById, setProviderById] = useState<Record<string, ProviderDoc>>({});
  const [slotById, setSlotById] = useState<Record<string, SlotDoc>>({});
  const [appointmentsStatus, setAppointmentsStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [myProvider, setMyProvider] = useState<ProviderDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    getProviderByUserId(user.$id).then(setMyProvider);
  }, [user]);

  useEffect(() => {
    if (!loaded) return;
    if (favorites.length === 0) {
      setFoods([]);
      setFoodsStatus('idle');
      return;
    }
    setFoodsStatus('loading');
    Promise.all(favorites.map((f) => getFood(Number(f.foodId))))
      .then((results) => {
        setFoods(results);
        setFoodsStatus('idle');
      })
      .catch(() => setFoodsStatus('error'));
  }, [loaded, favorites]);

  useEffect(() => {
    if (!user) return;
    listAllCompletedProgress(user.$id)
      .then((docs) => setCompletedCount(docs.length))
      .catch(() => setCompletedCount(null));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setAppointmentsStatus('loading');
    listMyAppointments(user.$id)
      .then(async (docs) => {
        setAppointments(docs);
        const uniqueProviderIds = Array.from(new Set(docs.map((a) => a.providerId)));
        const uniqueSlotIds = Array.from(new Set(docs.map((a) => a.slotId)));
        const [providers, slots] = await Promise.all([
          Promise.all(uniqueProviderIds.map((pid) => getProvider(pid))),
          Promise.all(uniqueSlotIds.map((sid) => getSlot(sid)))
        ]);
        const pMap: Record<string, ProviderDoc> = {};
        providers.forEach((p) => {
          if (p) pMap[p.$id] = p;
        });
        const sMap: Record<string, SlotDoc> = {};
        slots.forEach((s) => {
          if (s) sMap[s.$id] = s;
        });
        setProviderById(pMap);
        setSlotById(sMap);
        setAppointmentsStatus('idle');
      })
      .catch(() => setAppointmentsStatus('error'));
  }, [user]);

  async function handleCancel(appointmentId: string) {
    setCancellingId(appointmentId);
    try {
      await cancelAppointment(appointmentId);
      setAppointments((prev) => prev.filter((a) => a.$id !== appointmentId));
    } finally {
      setCancellingId(null);
    }
  }

  const role = profile?.role ?? 'USER';
  const isContributor = CONTRIBUTOR_ROLES.includes(role);
  const initial = (user?.name || 'T').trim().charAt(0).toUpperCase();
  const memberSince = user?.registration
    ? new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(user.registration))
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Profile header */}
      <section className="flex flex-col gap-5 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-950 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-500 font-display text-2xl text-white">
            {initial}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">{user?.name || 'Friend'}</h1>
              {role !== 'USER' && (
                <span className="rounded-full bg-clay-400/20 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-clay-500 dark:text-clay-400">
                  {ROLE_LABEL[role] ?? role}
                </span>
              )}
              {myProvider && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-brand-700 dark:bg-ink-800 dark:text-brand-100">
                  Provider
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-brand-500 dark:text-brand-100">{user?.email}</p>
            {memberSince && (
              <p className="mt-0.5 text-xs text-brand-300 dark:text-brand-100">Member since {memberSince}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to="/settings"
            className="rounded-md border border-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 hover:border-brand-500 dark:border-ink-800 dark:text-sand-100"
          >
            Settings
          </Link>
          <button
            onClick={() => logout()}
            className="rounded-md border border-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 hover:border-clay-500 hover:text-clay-500 dark:border-ink-800 dark:text-sand-100"
          >
            Log out
          </button>
        </div>
      </section>

      {/* Quick stats */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Favorite foods" value={loaded ? favorites.length : null} />
        <StatTile label="Lessons completed" value={completedCount} />
        <Link
          to="/provider"
          className="flex flex-col justify-center rounded-lg border border-brand-100 bg-sand-50 p-4 text-brand-700 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-900/40 dark:text-sand-100"
        >
          <span className="font-mono text-base font-semibold">Provider</span>
          <span className="text-xs">{myProvider ? 'Manage your practice →' : 'Claim your profile →'}</span>
        </Link>
        {isContributor && (
          <Link
            to="/admin"
            className="flex flex-col justify-center rounded-lg border border-clay-400/40 bg-clay-400/10 p-4 text-clay-500 transition hover:border-clay-500 dark:text-clay-400"
          >
            <span className="font-mono text-base font-semibold">Review queue</span>
            <span className="text-xs">Open admin console →</span>
          </Link>
        )}
      </section>

      {/* Appointments */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Your appointments</h2>
          <Link to="/care" className="text-sm font-medium text-brand-500 underline dark:text-brand-100">
            Find a provider
          </Link>
        </div>

        {appointmentsStatus === 'loading' ? (
          <div className="mt-3 h-16 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950" />
        ) : appointmentsStatus === 'error' ? (
          <p className="mt-3 text-sm text-clay-500 dark:text-clay-400">Couldn't load your appointments right now.</p>
        ) : appointments.length === 0 ? (
          <div className="mt-3 rounded-lg border border-brand-100 p-6 text-brand-500 dark:text-brand-100 dark:border-ink-800">
            <p>No appointments booked yet.</p>
            <Link to="/care" className="mt-2 inline-block text-sm font-medium text-brand-700 underline dark:text-sand-100">
              Find a dietitian or doctor
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {appointments.map((appt) => {
              const provider = providerById[appt.providerId];
              const slot = slotById[appt.slotId];
              return (
                <div
                  key={appt.$id}
                  className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
                >
                  <div>
                    <p className="font-medium text-brand-700 dark:text-sand-100">{provider?.name ?? 'Provider'}</p>
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
                  <div className="flex shrink-0 items-center gap-4">
                    <Link
                      to={`/appointments/${appt.$id}/messages`}
                      className="text-sm font-medium text-brand-500 underline dark:text-brand-100"
                    >
                      Message
                    </Link>
                    <button
                      onClick={() => handleCancel(appt.$id)}
                      disabled={cancellingId === appt.$id}
                      className="text-sm font-medium text-clay-500 underline hover:text-clay-400 disabled:opacity-60"
                    >
                      {cancellingId === appt.$id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Favorite foods */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Favorite foods</h2>
          <Link to="/foods" className="text-sm font-medium text-brand-500 underline dark:text-brand-100">
            Browse foods
          </Link>
        </div>

        {!loaded || foodsStatus === 'loading' ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-brand-100 bg-white dark:border-ink-800 dark:bg-ink-950" />
            ))}
          </div>
        ) : foodsStatus === 'error' ? (
          <p className="mt-3 text-sm text-clay-500 dark:text-clay-400">Couldn't load your favorites right now.</p>
        ) : foods.length === 0 ? (
          <div className="mt-3 rounded-lg border border-brand-100 p-6 text-brand-500 dark:text-brand-100 dark:border-ink-800">
            <p>No favorite foods yet.</p>
            <Link to="/foods" className="mt-2 inline-block text-sm font-medium text-brand-700 underline dark:text-sand-100">
              Browse foods to add some
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {foods.map((food) => (
              <Link
                key={food.id}
                to={`/foods/${food.id}`}
                className="rounded-lg border border-brand-100 bg-white p-4 transition hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950"
              >
                <p className="font-medium text-brand-700 dark:text-sand-100">{food.food_name}</p>
                <p className="text-xs text-brand-300 dark:text-brand-100">{food.category}</p>
                <p className="mt-2 font-mono text-sm text-brand-500 dark:text-brand-100">{food.kcal} kcal</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Learning progress */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Learning progress</h2>
          <Link to="/courses" className="text-sm font-medium text-brand-500 underline dark:text-brand-100">
            Browse courses
          </Link>
        </div>
        <div className="mt-3 rounded-lg border border-brand-100 p-6 text-brand-500 dark:text-brand-100 dark:border-ink-800">
          {completedCount === null ? (
            <p>Courses aren't built yet. This will show your progress once they are.</p>
          ) : completedCount === 0 ? (
            <>
              <p>You haven't completed any lessons yet.</p>
              <Link to="/courses" className="mt-2 inline-block text-sm font-medium text-brand-700 underline dark:text-sand-100">
                Start a course
              </Link>
            </>
          ) : (
            <p>
              You've completed <span className="font-mono font-semibold text-brand-700 dark:text-sand-100">{completedCount}</span>{' '}
              lesson{completedCount === 1 ? '' : 's'} so far. Keep going!
            </p>
          )}
        </div>
      </section>

      {/* Saved articles */}
      <section className="mt-10">
        <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Saved articles</h2>
        <div className="mt-3 rounded-lg border border-brand-100 p-6 text-brand-500 dark:text-brand-100 dark:border-ink-800">
          <p>Articles aren't built yet. Bookmarked ones will show here.</p>
        </div>
      </section>

      {/* Grow with Thanzi Guide / contribute CTA */}
      <section className="mt-10 rounded-lg border border-brand-100 bg-sand-100 p-6 dark:border-ink-800 dark:bg-ink-900">
        {isContributor ? (
          <>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-50">
              You have {ROLE_LABEL[role] ?? role} access
            </h2>
            <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
              You can review and publish drafts from the admin console.
            </p>
            <Link
              to="/admin"
              className="mt-3 inline-block rounded-md bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Open admin console
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-50">Know your food or health topics well?</h2>
            <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
              Thanzi Guide is written and reviewed by real editors and nutrition experts. Get in touch if you'd
              like to help grow the food database or write articles.
            </p>
            <Link
              to="/support"
              className="mt-3 inline-block rounded-md border border-brand-500 px-4 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-500 hover:text-white dark:text-sand-50"
            >
              Get in touch
            </Link>
          </>
        )}
      </section>

      {/* Partner with us — organizations, not individual contributors */}
      <section className="mt-6 rounded-lg border border-brand-100 p-6 dark:border-ink-800">
        <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Run a clinic or organization?</h2>
        <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
          Partner with Thanzi Guide to join the provider directory or collaborate on content.
        </p>
        <Link
          to="/partner"
          className="mt-3 inline-block text-sm font-medium text-brand-700 underline dark:text-sand-100"
        >
          Partner with us
        </Link>
      </section>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
      <p className="font-mono text-2xl font-semibold text-brand-700 dark:text-sand-50">
        {value === null ? '—' : value}
      </p>
      <p className="mt-0.5 text-xs uppercase tracking-wide text-brand-300 dark:text-brand-100">{label}</p>
    </div>
  );
}
