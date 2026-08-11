import { NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

// Mobile-only bottom tab bar. Sits alongside the header's desktop nav
// rather than replacing it — this is the "app-like" navigation surface
// for phones, similar to the tab bars in native apps.
export function BottomNav() {
  const { user } = useAuth();

  const tabs = [
    { to: '/', label: 'Home', icon: HomeIcon, end: true },
    { to: '/ask', label: 'Ask', icon: AskIcon, end: false },
    { to: '/foods', label: 'Browse', icon: BrowseIcon, end: false },
    { to: '/learn', label: 'Learn', icon: LearnIcon, end: false },
    { to: user ? '/dashboard' : '/login', label: 'You', icon: YouIcon, end: false }
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-sand-50/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-between px-2">
        {tabs.map((tab) => (
          <li key={tab.label} className="flex-1">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  isActive ? 'text-brand-700' : 'text-brand-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon active={isActive} />
                  {tab.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 11.5L12 4l8 7.5"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v9a1 1 0 001 1h3v-5a2 2 0 012-2 2 2 0 012 2v5h3a1 1 0 001-1v-9"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AskIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2H9l-4 3.5V16.5a2 2 0 01-2-2v-9z"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9.2c0-1.2 1.1-2.1 2.5-2.1s2.3.9 2.3 1.9c0 1.6-2.3 1.7-2.3 3.2"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinecap="round"
      />
      <circle cx="12" cy="14.7" r="0.9" fill="currentColor" />
    </svg>
  );
}

function BrowseIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} />
      <path
        d="M15 9l-2 4.5-4.5 2L10.5 11 15 9z"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LearnIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5h6a2 2 0 012 2v11a1.5 1.5 0 00-1.5-1.5H4V5.5z"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinejoin="round"
      />
      <path
        d="M20 5.5h-6a2 2 0 00-2 2v11a1.5 1.5 0 011.5-1.5H20V5.5z"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function YouIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} />
      <path
        d="M5 19.5c1.2-3.3 4-5 7-5s5.8 1.7 7 5"
        stroke="currentColor"
        strokeWidth={active ? 2.25 : 1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}
