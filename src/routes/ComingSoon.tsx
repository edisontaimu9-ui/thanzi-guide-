import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  useDocumentTitle(title);
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-clay-500">Coming soon</p>
      <h1 className="mt-2 font-display text-3xl text-brand-700">{title}</h1>
      <p className="mt-4 text-brand-500">{description}</p>
    </main>
  );
}
