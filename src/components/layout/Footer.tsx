import { Link } from 'react-router-dom';

export function Footer() {
  const forYou = [
    { to: '/women', label: 'Women' },
    { to: '/men', label: 'Men' },
    { to: '/kids', label: 'Kids' },
    { to: '/seniors', label: 'Seniors' }
  ];

  const linkClass =
    'text-xs text-brand-500 underline hover:text-brand-700 dark:text-brand-100 dark:hover:text-white';

  return (
    <footer className="border-t border-brand-100 bg-sand-100 dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-brand-300 dark:text-brand-100">
            Health for you
          </p>
          <div className="mt-2 flex flex-wrap gap-4">
            {forYou.map((item) => (
              <Link key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-brand-100 pt-6 dark:border-ink-800">
          <p className="text-xs text-brand-300 dark:text-brand-100">
            © {new Date().getFullYear()} Thanzi Guide.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/recipes" className={linkClass}>
              Recipes
            </Link>
            <Link to="/fitness" className={linkClass}>
              Fitness
            </Link>
            <Link to="/care" className={linkClass}>
              Find a Dietitian
            </Link>
            <Link to="/partner" className={linkClass}>
              Partner with us
            </Link>
            <Link to="/support" className={linkClass}>
              Help &amp; Support
            </Link>
            <Link to="/references" className={linkClass}>
              References
            </Link>
            <Link to="/about" className={linkClass}>
              About
            </Link>
            <Link to="/terms" className={linkClass}>
              Terms of Use
            </Link>
            <Link to="/privacy" className={linkClass}>
              Privacy Policy
            </Link>
            <Link to="/cookies" className={linkClass}>
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
