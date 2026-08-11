import { FormEvent, useState } from 'react';
import { submitPartnerInquiry } from '@/lib/partners';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Partner() {
  useDocumentTitle('Partner with us');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitPartnerInquiry({ name, organization, email, phone, message });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that — please try emailing us instead.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">Partner with us</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Clinics, NGOs, dietitians, and health organizations working on nutrition and health in Malawi —
        we'd like to hear from you. That could mean joining the provider directory, contributing content
        with your name attached, or something else entirely.
      </p>

      {sent ? (
        <div className="mt-8 rounded-lg border border-brand-500 bg-brand-50 p-6 text-brand-700 dark:bg-brand-700 dark:text-sand-50">
          <p className="font-medium">Thanks — we've got your message.</p>
          <p className="mt-1 text-sm">We'll get back to you at the email you provided.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
              Your name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-sand-50"
            />
          </div>
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
              Organization (optional)
            </label>
            <input
              id="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-sand-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-sand-50"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
              Phone (optional)
            </label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-sand-50"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
              Tell us a bit about what you have in mind
            </label>
            <textarea
              id="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-brand-700 dark:bg-brand-900 dark:text-sand-50"
            />
          </div>
          {error && <p className="text-sm text-clay-500 dark:text-clay-400">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}
    </main>
  );
}
