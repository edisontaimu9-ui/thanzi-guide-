import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-sand-100 dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-brand-300 dark:text-brand-100">
            © {new Date().getFullYear()} Thanzi Guide.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/care" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Find a Dietitian
            </Link>
            <Link to="/partner" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Partner with us
            </Link>
            <Link to="/support" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Help &amp; Support
            </Link>
            <Link to="/terms" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Terms of Use
            </Link>
            <Link to="/privacy" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/cookies" className="text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
