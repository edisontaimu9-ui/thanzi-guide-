import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useTheme, ThemePreference } from '@/lib/theme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { account, databases, DB } from '@/lib/appwrite';

const THEME_OPTIONS: { value: ThemePreference; label: string; hint: string }[] = [
  { value: 'system', label: 'System', hint: 'Match your device' },
  { value: 'light', label: 'Light', hint: 'Always light' },
  { value: 'dark', label: 'Dark', hint: 'Always dark' }
];

export function Settings() {
  useDocumentTitle('Settings');
  const { user, profile, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const push = usePushNotifications();

  const [name, setName] = useState(user?.name ?? '');
  const [nameStatus, setNameStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [nameError, setNameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'working' | 'done' | 'error'>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || name === user?.name) return;
    setNameStatus('working');
    setNameError(null);
    try {
      await account.updateName(name.trim());
      if (profile) {
        await databases.updateDocument(DB.databaseId, DB.collections.profiles, profile.$id, {
          name: name.trim()
        });
      }
      await refresh();
      setNameStatus('done');
      setTimeout(() => setNameStatus('idle'), 2000);
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Could not update your name.');
      setNameStatus('error');
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordStatus('working');
    setPasswordError(null);
    try {
      await account.updatePassword(newPassword, currentPassword);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordStatus('done');
      setTimeout(() => setPasswordStatus('idle'), 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update your password.');
      setPasswordStatus('error');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Settings</h1>
      <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
        Manage your appearance, notifications, and account.
      </p>

      {/* Appearance */}
      <section className="mt-8 rounded-2xl border border-brand-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-950">
        <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Appearance</h2>
        <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">Choose how Thanzi Guide looks on this device.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPreference(opt.value)}
              aria-pressed={preference === opt.value}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                preference === opt.value
                  ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-sand-50'
                  : 'border-brand-100 text-brand-500 hover:border-brand-500 dark:border-ink-800 dark:text-brand-100'
              }`}
            >
              <span className="block text-sm font-medium">{opt.label}</span>
              <span className="mt-0.5 block text-xs opacity-80">{opt.hint}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-950">
        <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Notifications</h2>
        <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
          Get push notifications for appointment reminders and updates.
        </p>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-100 p-4 dark:border-ink-800">
          <div>
            <p className="text-sm font-medium text-brand-700 dark:text-sand-100">Push notifications</p>
            <p className="text-xs text-brand-300 dark:text-brand-100">
              {!push.supported
                ? 'Not supported in this browser.'
                : push.subscribed
                ? 'Enabled on this device.'
                : 'Off on this device.'}
            </p>
          </div>
          {push.supported && (
            <button
              type="button"
              onClick={() => (push.subscribed ? push.disable() : push.enable())}
              disabled={push.status === 'working' || !user}
              aria-pressed={push.subscribed}
              className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
                push.subscribed ? 'bg-brand-500' : 'bg-brand-100 dark:bg-ink-800'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  push.subscribed ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          )}
        </div>
        {!user && (
          <p className="mt-2 text-xs text-brand-300 dark:text-brand-100">
            <Link to="/login" className="underline">
              Log in
            </Link>{' '}
            to enable push notifications.
          </p>
        )}
        {push.error && <p className="mt-2 text-sm text-clay-500 dark:text-clay-400">{push.error}</p>}
      </section>

      {user ? (
        <>
          {/* Account: name */}
          <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-950">
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Profile</h2>
            <form onSubmit={handleNameSubmit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
                  Display name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Email</label>
                <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">{user.email}</p>
              </div>
              {nameError && (
                <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
                  {nameError}
                </p>
              )}
              <button
                type="submit"
                disabled={nameStatus === 'working' || !name.trim() || name === user.name}
                className="rounded-md bg-brand-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {nameStatus === 'working' ? 'Saving…' : nameStatus === 'done' ? 'Saved ✓' : 'Save name'}
              </button>
            </form>
          </section>

          {/* Account: password */}
          <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-950">
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Password</h2>
            <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
                />
              </div>
              {passwordError && (
                <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
                  {passwordError}
                </p>
              )}
              <button
                type="submit"
                disabled={passwordStatus === 'working' || !currentPassword || !newPassword}
                className="rounded-md bg-brand-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {passwordStatus === 'working' ? 'Updating…' : passwordStatus === 'done' ? 'Updated ✓' : 'Update password'}
              </button>
            </form>
          </section>

          {/* Account: sign out */}
          <section className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-950">
            <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Sign out</h2>
            <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">Sign out of Thanzi Guide on this device.</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 rounded-md border border-brand-100 px-4 py-1.5 text-sm font-medium text-brand-700 hover:border-clay-500 hover:text-clay-500 dark:border-ink-800 dark:text-sand-100"
            >
              Log out
            </button>
          </section>
        </>
      ) : (
        <section className="mt-6 rounded-2xl border border-brand-100 bg-sand-100 p-6 dark:border-ink-800 dark:bg-ink-900">
          <p className="text-sm text-brand-500 dark:text-brand-100">
            <Link to="/login" className="font-medium text-brand-700 underline dark:text-sand-100">
              Log in
            </Link>{' '}
            to manage your profile and password.
          </p>
        </section>
      )}
    </main>
  );
}
