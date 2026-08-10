import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl text-brand-700">Page not found</h1>
      <p className="mt-2 text-brand-500">That page doesn't exist, or has moved.</p>
      <Link to="/" className="mt-6 underline text-brand-500">
        Back to Thanzi Guide
      </Link>
    </main>
  );
}
