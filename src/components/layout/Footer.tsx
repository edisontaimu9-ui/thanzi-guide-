import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-sand-100 dark:border-brand-700 dark:bg-brand-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="max-w-2xl text-sm text-brand-700 dark:text-sand-50">
          Thanzi Guide provides educational information about nutrition and
          health. It does not diagnose conditions and is not a substitute for
          advice from a qualified health professional — always consult a
          clinician for medical concerns.
        </p>
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-brand-300 dark:text-brand-100">
            © {new Date().getFullYear()} Thanzi Guide.
          </p>
          <div className="flex gap-4">
            <Link to="/care" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Find a Dietitian
            </Link>
            <Link to="/partner" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Partner with us
            </Link>
            <Link to="/support" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Help &amp; Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
