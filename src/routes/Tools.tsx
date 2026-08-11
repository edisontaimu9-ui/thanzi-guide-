import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const tools = [
  {
    to: '/tools/bmi',
    title: 'BMI Calculator',
    description: 'Estimate your body mass index from your height and weight.'
  },
  {
    to: '/tools/energy',
    title: 'Energy Estimator',
    description: 'Estimate your daily energy (calorie) needs based on activity level.'
  }
];

export function Tools() {
  useDocumentTitle('Health Tools');
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Health Tools</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Quick estimates to help you understand your body and energy needs.
      </p>

      <ul className="mt-8 space-y-3">
        {tools.map((tool) => (
          <li key={tool.to}>
            <Link
              to={tool.to}
              className="block rounded-lg border border-brand-100 bg-white p-5 transition hover:border-brand-500 dark:border-brand-700 dark:bg-brand-900"
            >
              <p className="font-display text-lg text-brand-700 dark:text-sand-100">{tool.title}</p>
              <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">{tool.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
