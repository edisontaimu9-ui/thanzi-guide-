import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { account } from '@/lib/appwrite';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type Status = 'verifying' | 'success' | 'error';

// Appwrite's verification email links here with ?userId=...&secret=... in
// the query string. We just need to hand those back to Appwrite via
// account.updateVerification to actually mark the email as verified —
// account.createVerification() only *sends* the email, it doesn't complete
// anything on its own.
export function Verify() {
  useDocumentTitle('Verify email');
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');

  useEffect(() => {
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');

    if (!userId || !secret) {
      setStatus('error');
      return;
    }

    account
      .updateVerification(userId, secret)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 text-center">
      {status === 'verifying' && (
        <>
          <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Verifying your email…</h1>
          <p className="mt-2 text-brand-500 dark:text-brand-100">This will only take a moment.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Email verified</h1>
          <p className="mt-2 text-brand-500 dark:text-brand-100">Your Thanzi Guide account is confirmed.</p>
          <Link to="/dashboard" className="mt-6 underline text-brand-500 dark:text-brand-100">
            Go to your dashboard
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Verification link expired</h1>
          <p className="mt-2 text-brand-500 dark:text-brand-100">
            This link is invalid or has already been used. Log in and request a new one from Settings.
          </p>
          <Link to="/login" className="mt-6 underline text-brand-500 dark:text-brand-100">
            Back to log in
          </Link>
        </>
      )}
    </main>
  );
}
