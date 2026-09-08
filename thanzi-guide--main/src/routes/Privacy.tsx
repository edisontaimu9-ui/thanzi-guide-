import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Privacy() {
  useDocumentTitle('Privacy Policy');
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">Privacy Policy</h1>
      <p className="mt-2 text-sm text-brand-300 dark:text-brand-100">Last updated August 2026</p>

      <div className="mt-8 space-y-8 text-brand-700 dark:text-sand-100">
        <section>
          <h2 className="font-display text-lg">What we collect</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            When you create an account: your name and email address. As you use the app: favorite foods,
            course progress, and, if you book one, the details you provide for a provider appointment
            (name, reason for the visit) or a partner inquiry (name, organization, email, phone, message).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">How it's used</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            To run your account and the features you use: showing your favorites and progress, connecting
            you with a provider you've booked, and following up on partner inquiries. We don't sell your
            data or use it for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Where it's stored</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Data is stored with Appwrite, our backend provider. Appointment and favorite data is scoped so
            only you (and, for appointments, admins facilitating the booking) can read it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Your choices</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            You can remove favorites and cancel appointments yourself from your account at any time. To
            request a copy of your data or have your account deleted, email us. See below.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Contact</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Questions about your data? Email{' '}
            <a href="mailto:support@thanziguide.org" className="underline">
              support@thanziguide.org
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
