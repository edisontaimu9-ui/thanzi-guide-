import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent, onConsentChange } from '@/lib/consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(() => !getConsent());

  useEffect(() => onConsentChange(() => setVisible(!getConsent())), []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-4 top-20 z-50 mx-auto max-w-lg rounded-lg border border-brand-100 bg-white p-4 shadow-lg dark:border-ink-800 dark:bg-ink-950"
    >
      <p className="text-sm text-brand-700 dark:text-sand-50">
        We use essential storage to keep you signed in and remember things like your theme. With your
        permission we'd also like to use analytics storage to understand how Thanzi Guide is used. Read our{' '}
        <Link to="/cookies" className="underline">
          Cookie Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setConsent('necessary')}
          className="rounded-md border border-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700 hover:border-brand-500 dark:border-ink-800 dark:text-sand-100"
        >
          Necessary only
        </button>
        <button
          type="button"
          onClick={() => setConsent('all')}
          className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
