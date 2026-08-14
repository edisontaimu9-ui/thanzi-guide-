import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getProviderByUserId, ProviderDoc } from '@/lib/providers';

interface ProviderRouteProps {
  children: (provider: ProviderDoc) => React.ReactNode;
}

export function ProviderRoute({ children }: ProviderRouteProps) {
  const { user, loading } = useAuth();
  const [provider, setProvider] = useState<ProviderDoc | null | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      setProvider(null);
      return;
    }
    getProviderByUserId(user.$id).then(setProvider);
  }, [user]);

  if (loading || provider === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-brand-500 dark:text-brand-100">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!provider) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Not a provider account</h1>
        <p className="mt-2 text-brand-500 dark:text-brand-100">
          This area is for linked provider accounts. Ask an admin to link your account if you think
          this is a mistake.
        </p>
      </main>
    );
  }

  return <>{children(provider)}</>;
}
