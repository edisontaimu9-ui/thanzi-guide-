import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Terms() {
  useDocumentTitle('Terms of Use');
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">Terms of Use</h1>
      <p className="mt-2 text-sm text-brand-300 dark:text-brand-100">Last updated August 2026</p>

      <div className="mt-8 space-y-8 text-brand-700 dark:text-sand-100">
        <section>
          <h2 className="font-display text-lg">1. Not medical advice</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide provides educational information about nutrition and health, including food data,
            articles, courses, and estimate tools like the BMI and energy calculators. It does not diagnose
            conditions and is not a substitute for advice from a qualified health professional. Always
            consult a clinician for medical concerns, and use the emergency services available in your area
            for urgent situations.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">2. Booking with providers</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            The "Find a Dietitian or Doctor" directory lets you book time with independent professionals.
            Thanzi Guide facilitates the booking but is not itself a healthcare provider and is not
            responsible for the advice or care given during an appointment. Cancel through your account if
            your plans change.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">3. Your account</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            You're responsible for keeping your login details secure and for activity that happens under
            your account. Let us know if you believe your account has been accessed without permission.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">4. Content accuracy</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Food and article content is reviewed by an editor or nutrition expert before publishing, but
            errors can happen. If something looks wrong, please report it — see{' '}
            <a href="/support" className="underline">
              Help &amp; Support
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">5. Acceptable use</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Don't misuse the service — that includes attempting to disrupt it, scraping content at scale,
            impersonating others, or submitting false information when booking a provider appointment or
            contacting us as a partner.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">6. Changes</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            We may update these terms as the service grows. Meaningful changes will be reflected by the
            "last updated" date above.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">7. Contact</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Questions about these terms? Email{' '}
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
