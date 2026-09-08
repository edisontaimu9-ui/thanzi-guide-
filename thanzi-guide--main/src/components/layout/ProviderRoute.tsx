import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getProviderByUserId, ProviderDoc } from '@/lib/providers';
import { functions, FUNCTIONS, databases, DB, BUCKETS } from '@/lib/appwrite';
import { uploadImage } from '@/lib/storage';
import { LoadingRunner } from '@/components/LoadingRunner';

interface ProviderRouteProps {
  children: (provider: ProviderDoc) => React.ReactNode;
}

export function ProviderRoute({ children }: ProviderRouteProps) {
  const { user, loading } = useAuth();
  const [provider, setProvider] = useState<ProviderDoc | null | undefined>(undefined);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  // Tracks a claim that just succeeded this session, so we can show the
  // one-time "add your photo" prompt below rather than dropping the
  // claimant straight into the dashboard with a blank avatar.
  const [justClaimed, setJustClaimed] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function checkProvider() {
    if (!user) {
      setProvider(null);
      return;
    }
    const found = await getProviderByUserId(user.$id);
    setProvider(found);
    return found;
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
        setJustClaimed(true);
        await checkProvider();
      }
    } catch (err) {
      setClaimMessage(err instanceof Error ? err.message : 'Something went wrong claiming your profile.');
    } finally {
      setClaiming(false);
    }
  }

  async function handlePhotoCapture(file: File) {
    if (!provider) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const url = await uploadImage(BUCKETS.media, file);
      await databases.updateDocument(DB.databaseId, DB.collections.providers, provider.$id, { photoUrl: url });
      await checkProvider();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Photo upload failed — try again.');
    } finally {
      setPhotoUploading(false);
    }
  }

  if (loading || provider === undefined) {
    return <LoadingRunner fullScreen />;
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

  // Right after a successful claim, prompt for a profile photo before
  // continuing — patients browsing Care see a name-initial circle until a
  // photo is added, so getting one at claim time (rather than leaving it
  // to a buried settings page) means new providers actually show a face.
  if (justClaimed && !provider.photoUrl) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Add a profile photo</h1>
        <p className="mt-2 text-brand-500 dark:text-brand-100">
          Patients browsing Care see this photo next to your name. Take one now, or add it later from
          your profile.
        </p>

        <label className="mt-6 inline-block cursor-pointer rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          {photoUploading ? 'Uploading…' : 'Take a photo'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="user"
            disabled={photoUploading}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoCapture(file);
            }}
          />
        </label>

        {photoError && <p className="mt-4 text-sm text-clay-500 dark:text-clay-400">{photoError}</p>}

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setJustClaimed(false)}
            className="text-sm text-brand-500 underline dark:text-brand-100"
          >
            Skip for now
          </button>
        </div>
      </main>
    );
  }

  return <>{children(provider)}</>;
}
