import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const faqs = [
  {
    q: 'Is Thanzi Guide a substitute for seeing a doctor?',
    a: 'No. Thanzi Guide provides educational information and estimates — it does not diagnose conditions. Always consult a qualified health professional for medical concerns.'
  },
  {
    q: 'Where does the food and nutrition data come from?',
    a: "Food entries are reviewed by an editor or nutrition expert before publishing. If something looks wrong, please report it so it can be corrected."
  },
  {
    q: 'I found incorrect information — how do I report it?',
    a: 'Email us using the address below with a link to the page and what looks off. Corrections to health and nutrition content are treated as a priority.'
  },
  {
    q: 'Can I use Thanzi Guide offline?',
    a: "Yes — once you've installed it (Install banner, or your browser's \"Add to Home Screen\"), pages you've already visited stay available without a connection."
  }
];

export function Support() {
  useDocumentTitle('Support');
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">Help &amp; Support</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Answers to common questions, and how to reach us if you need more.
      </p>

      <div className="mt-8 space-y-6">
        {faqs.map((item) => (
          <div key={item.q} className="rounded-lg border border-brand-100 bg-white p-5 dark:border-brand-700 dark:bg-brand-900">
            <p className="font-medium text-brand-700 dark:text-sand-50">{item.q}</p>
            <p className="mt-1.5 text-sm text-brand-500 dark:text-brand-100">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg bg-brand-700 p-6 text-sand-50">
        <p className="font-display text-lg">Still need help?</p>
        <p className="mt-1.5 text-sm text-brand-100">
          Email us and we'll get back to you as soon as we can.
        </p>
        <a
          href="mailto:support@thanziguide.org"
          className="mt-4 inline-block rounded-md bg-sand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-white dark:text-sand-100 dark:bg-brand-700"
        >
          support@thanziguide.org
        </a>
      </div>
    </main>
  );
}
