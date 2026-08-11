import { useState, useRef, useEffect } from 'react';

// Placeholder data shape for when this is wired to a real `notifications`
// Appwrite collection (keyed by user, with a `read` boolean). For now there's
// no backend for it, so this always renders the empty state — the UI/UX is
// built and ready, swapping in real data later is just replacing this array
// with a query result.
interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
}

const notifications: Notification[] = [];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
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
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-brand-100 bg-white p-2 shadow-lg dark:border-brand-700 dark:bg-brand-900">
          <p className="px-2 py-1.5 text-sm font-medium text-brand-700 dark:text-sand-50">Notifications</p>
          {notifications.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-brand-300 dark:text-brand-100">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`rounded-md px-2 py-2 text-sm ${
                    n.read ? 'text-brand-500 dark:text-brand-100' : 'bg-brand-50 text-brand-700 dark:bg-brand-700 dark:text-sand-50'
                  }`}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs opacity-80">{n.body}</p>
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
