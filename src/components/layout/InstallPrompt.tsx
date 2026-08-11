import { useEffect, useState } from 'react';

// Chrome/Edge/Android fire this event when the app is installable and let us
// trigger the native install UI ourselves. Safari/iOS never fire it — there's
// no programmatic install API there, so users have to use Share → Add to
// Home Screen manually, and we can only show them how.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'thanzi-install-dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (isIos()) {
      setShowIosHint(true);
    }

    function handleAppInstalled() {
      setDeferredPrompt(null);
      setShowIosHint(false);
    }
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [dismissed]);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Thanzi Guide"
      className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-lg border border-brand-100 bg-white p-4 shadow-lg sm:bottom-4 dark:border-brand-700 dark:bg-brand-900"
    >
      <div className="text-sm text-brand-700 dark:text-sand-50">
        <p className="font-medium">Install Thanzi Guide</p>
        {deferredPrompt ? (
          <p className="mt-0.5 text-brand-500 dark:text-brand-100">Add it to your home screen for quick, offline access.</p>
        ) : (
          <p className="mt-0.5 text-brand-500 dark:text-brand-100">Tap the Share button, then "Add to Home Screen".</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {deferredPrompt && (
          <button
            onClick={install}
            className="rounded-md bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="rounded-md px-2 py-1.5 text-sm text-brand-300 hover:text-brand-700 dark:text-brand-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
