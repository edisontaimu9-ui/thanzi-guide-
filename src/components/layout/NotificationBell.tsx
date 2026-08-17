import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationDoc
} from '@/lib/notifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { LoadingRunner } from '@/components/LoadingRunner';

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const push = usePushNotifications();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!user) return;
    listNotifications(user.$id)
      .then((docs) => setNotifications(docs))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!open || !user) return;
    setStatus('loading');
    listNotifications(user.$id)
      .then((docs) => {
        setNotifications(docs);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [open, user]);

  async function handleSelect(n: NotificationDoc) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.$id === n.$id ? { ...x, read: true } : x)));
      markNotificationRead(n.$id).catch(() => {});
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead(unread).catch(() => {});
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-clay-500 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        // Fixed to the viewport rather than absolute-to-the-button: the bell
        // isn't always near the screen edge (it sits mid-row on mobile), so
        // anchoring a wide panel to its local position pushed it off-screen.
        // This keeps it pinned just under the header, right-aligned to the
        // viewport, regardless of where the bell itself sits.
        <div className="fixed right-3 top-16 z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-brand-100 bg-white p-2 shadow-lg dark:border-ink-800 dark:bg-ink-950">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-medium text-brand-700 dark:text-sand-50">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-brand-500 underline dark:text-brand-100"
              >
                Mark all read
              </button>
            )}
          </div>

          {push.supported && (
            <div className="mb-1 flex items-center justify-between rounded-md bg-brand-50 px-2 py-2 dark:bg-ink-900">
              <span className="text-xs text-brand-700 dark:text-sand-50">
                {push.subscribed ? 'Push notifications on' : 'Get push notifications'}
              </span>
              <button
                type="button"
                onClick={push.subscribed ? push.disable : push.enable}
                disabled={push.status === 'working'}
                className="text-xs font-medium text-brand-500 underline disabled:opacity-50 dark:text-brand-100"
              >
                {push.status === 'working' ? '…' : push.subscribed ? 'Turn off' : 'Turn on'}
              </button>
            </div>
          )}
          {push.error && (
            <p className="mb-1 px-2 text-xs text-clay-500 dark:text-clay-400">{push.error}</p>
          )}

          {status === 'loading' ? (
            <div className="px-2 py-4">
              <LoadingRunner size="sm" />
            </div>
          ) : status === 'error' ? (
            <p className="px-2 py-6 text-center text-sm text-clay-500 dark:text-clay-400">
              Couldn't load notifications.
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-brand-300 dark:text-brand-100">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.$id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(n)}
                    className={`w-full rounded-md px-2 py-2 text-left text-sm ${
                      n.read
                        ? 'text-brand-500 dark:text-brand-100'
                        : 'bg-brand-50 text-brand-700 dark:bg-ink-900 dark:text-sand-50'
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs opacity-80">{n.body}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 10a6 6 0 1112 0c0 3.2 1 4.8 1.8 5.7.4.4.1 1.1-.5 1.1H4.7c-.6 0-.9-.7-.5-1.1C5 14.8 6 13.2 6 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9.5 19a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
