import { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type HealthTopic = {
  title: string;
  body: string;
};

const HEALTH_TOPICS: HealthTopic[] = [
  {
    title: 'Essential Nutrients',
    body: 'Learn about the vitamins, minerals, protein, carbohydrates, and fats your body needs every day, and where to find them in everyday Malawian foods.',
  },
  {
    title: 'Pregnancy',
    body: 'Nutrition needs shift during pregnancy. Guidance on the extra nutrients that matter most, common concerns, and eating well through each trimester.',
  },
  {
    title: 'Health Conditions',
    body: 'How nutrition can help manage common health conditions such as diabetes, high blood pressure, and kidney disease, alongside medical care.',
  },
  {
    title: 'Wellness',
    body: 'Beyond individual nutrients, overall wellness ties together diet, activity, sleep, and mental health. Simple habits that support your wellbeing as a whole.',
  },
];

function HealthTopicAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mt-10 rounded-lg border border-brand-100 bg-sand-50 p-6 dark:border-ink-800 dark:bg-ink-900/40">
      <ul className="divide-y divide-brand-100 dark:divide-ink-800">
        {HEALTH_TOPICS.map((topic, index) => {
          const isOpen = openIndex === index;
          return (
            <li key={topic.title}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="font-semibold uppercase tracking-wide text-brand-700 dark:text-sand-100">
                  {topic.title}
                </span>
                <svg
                  className={`h-5 w-5 flex-shrink-0 text-brand-500 transition-transform dark:text-brand-100 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <p className="pb-4 text-sm text-brand-500 dark:text-brand-100">{topic.body}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Health() {
  useDocumentTitle('Health');

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Health</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Dietary needs change at every stage of life. A nutritious, balanced eating plan helps you
        get the nutrients you need, whether you're maintaining good health or managing a health
        condition.
      </p>

      <HealthTopicAccordion />
    </main>
  );
}
