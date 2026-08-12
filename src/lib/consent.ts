// Tracks the visitor's cookie/local-storage consent choice. We don't set any
// analytics or tracking cookies today, but this gives the app one place to
// check before it ever does, and drives the consent banner + settings toggle.
export type ConsentValue = 'all' | 'necessary';

export interface ConsentRecord {
  value: ConsentValue;
  timestamp: string;
}

const STORAGE_KEY = 'thanzi-cookie-consent';
const CHANGE_EVENT = 'thanzi-consent-changed';

export function getConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord) : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  const record: ConsentRecord = { value, timestamp: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

// Clears the stored choice so the banner reappears (used by the "Manage
// cookie preferences" action in Settings / the Cookie Policy page).
export function clearConsent(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.value === 'all';
}

// Subscribe to consent changes, including ones made in another tab.
export function onConsentChange(handler: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
