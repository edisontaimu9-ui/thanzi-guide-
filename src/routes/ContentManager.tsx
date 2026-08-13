import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { CONTENT_SCHEMAS } from '@/lib/contentSchemas';

export function ContentManager() {
  useDocumentTitle('Content Manager');

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/admin" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Content Review
      </Link>
      <h1 className="mt-4 font-display text-3xl text-brand-700 dark:text-sand-100">Content Manager</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Create and edit content directly here. New items save as drafts, only admins can publish.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {CONTENT_SCHEMAS.map((schema) => (
          <li key={schema.key}>
            <Link
              to={`/admin/content/${schema.key}`}
              className="block rounded-lg border border-brand-100 bg-white p-4 font-medium text-brand-700 hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-100"
            >
              {schema.label}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
