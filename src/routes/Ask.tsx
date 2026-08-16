import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Ask() {
  useDocumentTitle('Ask');

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Ask</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Ask health and nutrition questions and get answers grounded in Thanzi Guide's own content.
        This is on the way — check back soon.
      </p>
    </main>
  );
}
