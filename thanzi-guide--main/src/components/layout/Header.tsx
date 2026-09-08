import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';

const navLinks = [
  { to: '/browse', label: 'Browse' },
  { to: '/foods', label: 'Foods' },
  { to: '/health', label: 'Health' },
  { to: '/recipes', label: 'Recipes' },
  { to: '/learn', label: 'Learn' },
  { to: '/courses', label: 'Courses' },
  { to: '/tools', label: 'Tools' },
  { to: '/fitness', label: 'Fitness' }
];

const ADMIN_ROLES = ['EDITOR', 'NUTRITION_EXPERT', 'ADMIN'];

export function Header() {
  const { user, profile, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const canReview = !!profile && ADMIN_ROLES.includes(profile.role);
  const links = canReview ? [...navLinks, { to: '/admin', label: 'Review' }] : navLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-sand-50/95 backdrop-blur dark:border-ink-800 dark:bg-ink-950/95">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg text-brand-700 dark:text-sand-50">
          Thanzi Guide <span aria-hidden="true">🇲🇼</span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium ${
                  isActive ? 'text-brand-700 dark:text-sand-50' : 'text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/search" aria-label="Search" className="text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
            <SearchIcon />
          </Link>
          <NotificationBell />
          <ThemeToggle />
          <Link
            to="/settings"
            aria-label="Settings"
            className="text-brand-500 hover:text-brand-700 dark:text-brand-100 dark:hover:text-white"
          >
            <SettingsIcon />
          </Link>
          {!loading && (
            <Link
              to={user ? '/dashboard' : '/login'}
              className="rounded-md bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {user ? 'Dashboard' : 'Sign in'}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 lg:hidden">
          <NotificationBell />
          <ThemeToggle />
          <Link to="/search" aria-label="Search" className="text-brand-700 dark:text-sand-50">
            <SearchIcon />
          </Link>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="block h-0.5 w-6 bg-brand-700 dark:bg-sand-50" />
            <span className="mt-1.5 block h-0.5 w-6 bg-brand-700 dark:bg-sand-50" />
            <span className="mt-1.5 block h-0.5 w-6 bg-brand-700 dark:bg-sand-50" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" className="border-t border-brand-100 px-6 py-4 lg:hidden dark:border-ink-800" aria-label="Primary">
          <ul className="space-y-3">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium text-brand-700 dark:text-sand-50"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li>
              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-brand-700 dark:text-sand-50"
              >
                Settings
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/support"
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-brand-700 dark:text-sand-50"
              >
                Help &amp; Support
              </NavLink>
            </li>
            {!loading && (
              <li>
                <Link
                  to={user ? '/dashboard' : '/login'}
                  onClick={() => setMenuOpen(false)}
                  className="inline-block rounded-md bg-brand-500 px-4 py-1.5 text-sm font-medium text-white"
                >
                  {user ? 'Dashboard' : 'Sign in'}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 13a7.97 7.97 0 000-2l2.1-1.6-2-3.4-2.5 1a8 8 0 00-1.7-1L14.8 3H9.2l-.5 2.6a8 8 0 00-1.7 1l-2.5-1-2 3.4L4.6 11a7.97 7.97 0 000 2l-2.1 1.6 2 3.4 2.5-1a8 8 0 001.7 1l.5 2.6h5.6l.5-2.6a8 8 0 001.7-1l2.5 1 2-3.4L19.4 13z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
