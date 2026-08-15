import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getProviderByUserId, ProviderDoc } from '@/lib/providers';
import { functions, FUNCTIONS } from '@/lib/appwrite';

interface ProviderRouteProps {
  children: (provider: ProviderDoc) => React.ReactNode;
}

export function ProviderRoute({ children }: ProviderRouteProps) {
  const { user, loading } = useAuth();
  const [provider, setProvider] = useState<ProviderDoc | null | undefined>(undefined);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  async function checkProvider() {
    if (!user) {
      setProvider(null);
      return;
    }
    const found = await getProviderByUserId(user.$id);
    setProvider(found);
  }

  useEffect(() => {
    checkProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleClaim() {
    setClaiming(true);
    setClaimMessage(null);
    try {
      const execution = await functions.createExecution(FUNCTIONS.claimProviderProfile, '', false);
      const result = JSON.parse(execution.responseBody);
      setClaimMessage(result.message ?? (result.success ? 'Claimed.' : 'Something went wrong.'));
      if (result.success) {
        await checkProvider();
      }
    } catch (err) {
      setClaimMessage(err instanceof Error ? err.message : 'Something went wrong claiming your profile.');
    } finally {
      setClaiming(false);
    }
  }

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
          If an admin has set up a provider profile for you using this account's email, you can link
          it now.
        </p>
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="mt-6 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {claiming ? 'Checking…' : 'Claim your provider profile'}
        </button>
        {claimMessage && (
          <p className="mt-4 text-sm text-brand-500 dark:text-brand-100">{claimMessage}</p>
        )}
      </main>
    );
  }

  return <>{children(provider)}</>;
}
