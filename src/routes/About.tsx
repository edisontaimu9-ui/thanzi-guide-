import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function About() {
  useDocumentTitle('About Thanzi Guide');
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">About Thanzi Guide</h1>
      <p className="mt-2 text-sm text-brand-300 dark:text-brand-100">Health information, built for Malawi.</p>

      <div className="mt-8 space-y-8 text-brand-700 dark:text-sand-100">
        <section>
          <p className="text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide is a Malawian-founded health and wellness platform that makes reliable nutrition,
            fitness, and health information easier to understand, easier to access, and relevant to
            everyday life, connecting evidence-based knowledge with the foods, communities, and realities
            people actually live in.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We believe health information should not only be accurate. It should also make sense to the
            people who use it. Our journey starts in Malawi, grows with Africa, and serves a universal
            purpose: helping people make better-informed decisions about their health.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Mission &amp; Vision</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Our mission is to make trustworthy, understandable, and locally relevant health and nutrition
            information accessible to everyone, so people can understand their health, make informed
            decisions, build healthier habits, and know when to seek professional care.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We envision a future where everyone, regardless of where they live, can access health
            information they understand, trust, and use. Local roots, global purpose.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Why Thanzi Guide Exists</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            There is no shortage of health information online, but much of it is built for other
            populations, using unfamiliar foods and assumptions that don't reflect life in Malawi or across
            Africa. Thanzi Guide closes that gap: global knowledge, local context, practical guidance.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Built in Malawi, Inspired by Africa</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            We believe meaningful solutions can be built from local knowledge and shared with the wider
            world. Everything we build is guided by a few principles: familiar local foods, real cultural
            context, practical everyday guidance, credible evidence, thoughtful use of technology, and
            information that's genuinely easy to find and understand.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Aligned with Malawi 2063 and the SDGs</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide is inspired by the aspirations of Malawi 2063, Malawi's long-term vision for an
            inclusively wealthy, self-reliant nation, though we're an independent initiative and don't
            speak for the government. By improving health literacy and nutrition knowledge, we aim to
            support a healthier, more capable population and a more proactive, prevention-first mindset
            toward health.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Our work also connects to several UN Sustainable Development Goals, most directly{' '}
            <strong className="font-medium">SDG 3, Good Health and Well-being</strong>, through health
            education, prevention, and informed decision-making. It also supports{' '}
            <strong className="font-medium">SDG 2 (Zero Hunger)</strong> through nutrition and food
            literacy, <strong className="font-medium">SDG 4 (Quality Education)</strong> through accessible
            health knowledge, <strong className="font-medium">SDG 9 (Innovation)</strong> as an
            African-built digital health platform, and{' '}
            <strong className="font-medium">SDG 10 (Reduced Inequalities)</strong> by closing information
            gaps regardless of where someone lives.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Our African Vision</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Malawi is our starting point, not our limit. Africa isn't one uniform population, so our
            ambition is a platform that respects local differences while creating broader access to useful
            health knowledge, proving that African-built health technology can be relevant, credible, and
            capable of reaching the world.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Commitment to Evidence</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            We're committed to accurate, transparent, evidence-informed content, and to being clear about
            the difference between established evidence and general wellness information. Thanzi Guide does
            not replace a qualified healthcare professional. If you have symptoms, a medical condition, or
            health concerns, please seek advice from one.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Who Is Behind Thanzi Guide?</h2>
          <p className="mt-2 text-sm font-medium text-brand-700 dark:text-sand-100">Edison Taimu</p>
          <p className="text-xs text-brand-300 dark:text-brand-100">Founder</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide was founded by Edison Taimu, bringing together nutrition, health education, and
            technology to build digital health resources relevant to Malawi and scalable to the wider world.
          </p>
          <blockquote className="mt-3 border-l-2 border-brand-100 pl-4 text-sm italic text-brand-500 dark:border-ink-800 dark:text-brand-100">
            "Technology should not only make information faster to access. It should make useful
            information more relevant to the people it serves."
          </blockquote>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            As the platform grows, we aim to work with qualified healthcare professionals, nutrition
            experts, researchers, and educators to strengthen the quality and credibility of our content.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Where We're Going</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide is being built as more than a website: a trusted digital health and nutrition
            platform where people can discover reliable information, understand nutrition, explore local
            and global foods, and make more informed health decisions. As we grow, we hope to expand our
            content, collaborate with health professionals and institutions, and build tools that address
            real nutrition and health needs across Africa.
          </p>
        </section>

        <section className="text-center">
          <p className="text-sm font-medium text-brand-700 dark:text-sand-100">
            Better Information. Better Decisions. Better Health.
          </p>
          <p className="mt-4 text-sm text-brand-500 dark:text-brand-100">
            Built in Malawi. Inspired by Africa. Made for Humanity.
          </p>
          <p className="mt-4 text-lg">Thanzi Guide 🇲🇼🌍</p>
        </section>
      </div>
    </main>
  );
}
