import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from './InstallPrompt';
import { CookieBanner } from './CookieBanner';

// Ask is a chat surface — the site footer (life-stage links, recipes,
// partner/legal links) doesn't belong below a conversation, so it's
// skipped on that one route. Header and BottomNav still show.
const NO_FOOTER_PATHS = ['/ask'];

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const hideFooter = NO_FOOTER_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <div className="flex min-h-screen flex-col bg-sand-50 dark:bg-ink-950">
      <Header />
      <div className="flex-1 pb-16 sm:pb-0">{children}</div>
      {!hideFooter && <Footer />}
      <BottomNav />
      <InstallPrompt />
      <CookieBanner />
    </div>
  );
}
