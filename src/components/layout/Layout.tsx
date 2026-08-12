import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from './InstallPrompt';
import { CookieBanner } from './CookieBanner';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-sand-50 dark:bg-ink-950">
      <Header />
      <div className="flex-1 pb-16 sm:pb-0">{children}</div>
      <Footer />
      <BottomNav />
      <InstallPrompt />
      <CookieBanner />
    </div>
  );
}
