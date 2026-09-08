import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { clearConsent, getConsent } from '@/lib/consent';

export function CookiePolicy() {
  useDocumentTitle('Cookie Policy');
  const [consent, setConsentState] = useState(getConsent());

  function manage() {
    clearConsent();
    setConsentState(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">Cookie Policy</h1>
      <p className="mt-2 text-sm text-brand-300 dark:text-brand-100">Last updated August 2026</p>

      <div className="mt-8 space-y-8 text-brand-700 dark:text-sand-100">
        <section>
          <h2 className="font-display text-lg">What we use</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide mostly uses browser storage (cookies and local storage) rather than third-party
            trackers. Here's what's stored and why:
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Necessary</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Always on, since the app can't work without them. This covers your sign-in session, your theme
            preference, and this cookie choice itself. If you enable push notifications, your device's push
            subscription is also stored so we can deliver them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Analytics</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Off unless you choose "Accept all". We don't currently run any analytics, but we're keeping this
            category ready for anonymous, aggregate usage stats in future — never sold, never used for
            advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Your choice</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            {consent
              ? `You chose "${consent.value === 'all' ? 'Accept all' : 'Necessary only'}" on ${new Intl.DateTimeFormat('en', {
                  dateStyle: 'medium'
                }).format(new Date(consent.timestamp))}.`
              : "You haven't made a choice yet — you'll see the banner next time you load the app."}
            {' '}You can also change this anytime from Settings.
          </p>
          <button
            type="button"
            onClick={manage}
            className="mt-3 rounded-md border border-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 hover:border-brand-500 dark:border-ink-800 dark:text-sand-100"
          >
            Manage cookie preferences
          </button>
        </section>

        <section>
          <h2 className="font-display text-lg">Contact</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Questions about cookies or storage? Email{' '}
            <a href="mailto:support@thanziguide.org" className="underline">
              support@thanziguide.org
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
