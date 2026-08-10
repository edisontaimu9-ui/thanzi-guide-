import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

const navLinks = [
  { to: '/foods', label: 'Foods' },
  { to: '/learn', label: 'Learn' },
  { to: '/tools', label: 'Tools' }
];

export function Header() {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-sand-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg text-brand-700">
          Thanzi Guide <span aria-hidden="true">🇲🇼</span>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-brand-500 hover:text-brand-700'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/search" aria-label="Search" className="text-brand-500 hover:text-brand-700">
            <SearchIcon />
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

        <div className="flex items-center gap-4 sm:hidden">
          <Link to="/search" aria-label="Search" className="text-brand-700">
            <SearchIcon />
          </Link>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="block h-0.5 w-6 bg-brand-700" />
            <span className="mt-1.5 block h-0.5 w-6 bg-brand-700" />
            <span className="mt-1.5 block h-0.5 w-6 bg-brand-700" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-nav" className="border-t border-brand-100 px-6 py-4 sm:hidden" aria-label="Primary">
          <ul className="space-y-3">
            {navLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm font-medium text-brand-700"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
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

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
