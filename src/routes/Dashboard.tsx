import { useAuth } from '@/lib/auth-context';

export function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-700">Welcome, {user?.name || 'friend'}</h1>
        <button onClick={() => logout()} className="text-sm text-brand-500 underline">
          Log out
        </button>
      </div>
      <p className="mt-4 text-brand-500">
        Dashboard scaffold — progress, saved articles, favorite foods, and recommendations
        arrive in the dashboard build step.
      </p>
    </main>
  );
}
