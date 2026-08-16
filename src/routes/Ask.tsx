import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ReferencesSection } from '@/components/ReferencesSection';
import { useAuth } from '@/lib/auth-context';

export function Ask() {
  useDocumentTitle('Ask');
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Ask</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Ask health and nutrition questions and get answers grounded in Thanzi Guide's own content.
        The chat itself is on the way — in the meantime, you can already upload reference material
        below so it's ready to use once it launches.
      </p>

      {user ? (
        <ReferencesSection />
      ) : (
        <p className="mt-8 rounded-md border border-brand-100 p-4 text-sm text-brand-500 dark:border-ink-800 dark:text-brand-100">
          <Link to="/login" className="underline">
            Log in
          </Link>{' '}
          to upload reference material.
        </p>
      )}
    </main>
  );
}
