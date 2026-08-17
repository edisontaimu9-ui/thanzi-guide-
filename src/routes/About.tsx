import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function About() {
  useDocumentTitle('About Thanzi Guide');
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-50">About Thanzi Guide</h1>
      <p className="mt-2 text-sm text-brand-300 dark:text-brand-100">Health information, built for Malawi.</p>

      <div className="mt-8 space-y-10 text-brand-700 dark:text-sand-100">
        <section>
          <p className="text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide is a Malawian-founded health and wellness platform created to make reliable health
            information easier to understand, easier to access, and more relevant to everyday life.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We bring together practical information on nutrition, healthy eating, fitness, wellbeing, and
            health, connecting evidence-based knowledge with the foods, communities, and realities of
            everyday life.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We believe health information should not only be accurate. It should also make sense to the
            people who use it.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Our journey begins in Malawi, grows with Africa, and ultimately serves a universal purpose:
            helping people make better-informed decisions about their health.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Mission</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Our mission is to make trustworthy, understandable, and locally relevant health and nutrition
            information accessible to everyone. We aim to help people:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-brand-500 dark:text-brand-100">
            <li>Understand their health better</li>
            <li>Make informed health and nutrition decisions</li>
            <li>Develop healthier habits</li>
            <li>Better understand the food they eat</li>
            <li>Access practical and relevant health information</li>
            <li>Recognize when professional healthcare advice is needed</li>
          </ul>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We believe that better health begins with better information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Vision</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">A healthier, better-informed world.</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We envision a future where everyone, regardless of where they live, can access health
            information they can understand, trust, and use.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We want to contribute to communities where health literacy, good nutrition, prevention, and
            healthy living are part of everyday life.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Our vision begins with Malawi and extends across Africa and beyond. Local roots. Global purpose.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Why Thanzi Guide Exists</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            There is no shortage of health information in the world. The challenge is finding information
            that is accurate, understandable, trustworthy, and relevant to the people using it.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Much of the health and nutrition content available online is created for different populations
            and contexts. It may use unfamiliar foods, lifestyles, examples, and assumptions that do not
            reflect the realities of people in Malawi or across Africa.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide exists to help close that gap. We aim to bring evidence-based health knowledge
            closer to people, connecting scientific knowledge with real foods, real communities, and real
            everyday lives.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Global knowledge. Local context. Practical health guidance.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Built in Malawi. Inspired by Africa.</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">Malawi is where Thanzi Guide begins.</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We believe meaningful solutions can be built from local knowledge, local experiences, and local
            innovation, and then shared with the wider world. Thanzi Guide puts local context at the center
            while maintaining a broader African and global vision.
          </p>
          <dl className="mt-4 space-y-4 text-sm text-brand-500 dark:text-brand-100">
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Local Foods</dt>
              <dd className="mt-0.5">
                Helping people understand the nutritional value and role of foods that are familiar and
                available within their communities.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Local Context</dt>
              <dd className="mt-0.5">
                Presenting health and nutrition information in ways that reflect the realities, cultures,
                and lifestyles of the people we serve.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Practical Guidance</dt>
              <dd className="mt-0.5">
                Turning complex health information into clear, useful information that people can apply in
                everyday life.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Evidence</dt>
              <dd className="mt-0.5">
                Using credible sources, scientific evidence, and appropriate professional knowledge to
                support our content.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Innovation</dt>
              <dd className="mt-0.5">
                Using technology to create better ways for people to discover, understand, and use health
                information.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Accessibility</dt>
              <dd className="mt-0.5">
                Making useful health knowledge easier to find and understand, regardless of someone's
                location or background.
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Connection to Malawi 2063</h2>
          <p className="mt-2 text-sm font-medium text-brand-700 dark:text-sand-100">
            Contributing to the Malawi We Want
          </p>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide is inspired by the aspirations of Malawi 2063 (MW2063), Malawi's long-term national
            development vision for an inclusively wealthy and self-reliant industrialized upper-middle-income
            country.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We do not represent or speak on behalf of the Government of Malawi or the National Planning
            Commission. Thanzi Guide is an independent, Malawian-built initiative seeking to contribute to
            the broader aspirations of MW2063.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Health and nutrition are fundamental to human development. Thanzi Guide contributes through
            health literacy, nutrition education, digital innovation, and locally relevant information.
          </p>
          <dl className="mt-4 space-y-4 text-sm text-brand-500 dark:text-brand-100">
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Human Capital Development</dt>
              <dd className="mt-0.5">
                A healthy and well-informed population is an important foundation for learning, working,
                innovation, and economic participation. By improving access to understandable health and
                nutrition knowledge, Thanzi Guide seeks to contribute to a healthier and more capable
                population.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Mindset Change</dt>
              <dd className="mt-0.5">
                We encourage a proactive approach to health, helping people understand prevention, nutrition,
                and healthy living rather than viewing health only through the lens of illness and treatment.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Agriculture and Food</dt>
              <dd className="mt-0.5">
                Food is central to both health and development. By helping people understand the
                nutritional value of local foods, Thanzi Guide seeks to strengthen the connection between
                what communities produce, what people eat, and how nutrition contributes to wellbeing.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Science, Technology and Innovation</dt>
              <dd className="mt-0.5">
                Thanzi Guide uses digital technology to make health knowledge more accessible and to develop
                locally relevant solutions to health and nutrition challenges.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">Self-Reliance</dt>
              <dd className="mt-0.5">
                We believe Malawi and Africa can develop solutions to their own challenges. Thanzi Guide is
                built around a simple principle: local problems deserve locally relevant innovation.
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Contribution to the Sustainable Development Goals</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide is also aligned with the United Nations Sustainable Development Goals (SDGs). We
            believe better access to health and nutrition knowledge can contribute to healthier people,
            stronger communities, and sustainable development.
          </p>
          <dl className="mt-4 space-y-5 text-sm text-brand-500 dark:text-brand-100">
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">
                SDG 3, Good Health and Well-being <span className="font-normal text-brand-300 dark:text-brand-100">(Our primary SDG)</span>
              </dt>
              <dd className="mt-0.5">
                Thanzi Guide directly contributes to SDG 3 by making reliable health, nutrition, and
                wellness information easier to access and understand. We promote health literacy,
                prevention, healthy lifestyles, and informed decision-making, while encouraging people to
                seek professional care when needed.
              </dd>
              <dd className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Health education, nutrition awareness, prevention, healthy lifestyles, health literacy
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">SDG 2, Zero Hunger</dt>
              <dd className="mt-0.5">
                Good nutrition is fundamental to good health. Thanzi Guide supports SDG 2 by helping people
                better understand food, nutrition, dietary quality, and the nutritional value of foods
                available within their communities. By increasing nutrition knowledge, we aim to support
                better food choices and greater awareness of healthy diets.
              </dd>
              <dd className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Nutrition education, healthy diets, food literacy, local foods, nutrition awareness
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">SDG 4, Quality Education</dt>
              <dd className="mt-0.5">
                Health literacy is an important part of lifelong learning. Thanzi Guide contributes to SDG
                4 by translating complex health and nutrition knowledge into information that people can
                understand and apply.
              </dd>
              <dd className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Health education, nutrition literacy, lifelong learning, digital learning, knowledge sharing
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">
                SDG 9, Industry, Innovation and Infrastructure
              </dt>
              <dd className="mt-0.5">
                Thanzi Guide demonstrates how technology can be used to address real health and nutrition
                challenges. By building digital health solutions from Malawi, we aim to contribute to SDG 9
                and demonstrate the potential of locally developed technology to create practical solutions
                for African communities.
              </dd>
              <dd className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Digital health, technology, innovation, local solutions, African-built platforms
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">SDG 10, Reduced Inequalities</dt>
              <dd className="mt-0.5">
                Access to useful health information should not depend on where someone lives or how much
                they know about health. Thanzi Guide seeks to reduce information gaps by making health and
                nutrition knowledge more accessible, understandable, and locally relevant.
              </dd>
              <dd className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Accessible information, health literacy, inclusion, local context, information equity
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">
                SDG 12, Responsible Consumption and Production
              </dt>
              <dd className="mt-0.5">
                The food choices people make are connected to both health and sustainability. Through food
                and nutrition education, Thanzi Guide can help people better understand what they consume,
                the nutritional characteristics of foods, and the importance of informed choices.
              </dd>
              <dd className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Food literacy, informed consumption, nutrition awareness, sustainable food awareness
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">SDG 17, Partnerships for the Goals</dt>
              <dd className="mt-0.5">
                Better health outcomes cannot be achieved by one platform alone. As Thanzi Guide grows, we
                aim to collaborate with healthcare professionals, nutritionists, researchers, educators,
                institutions, technology developers, and other organizations.
              </dd>
              <dd className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Collaboration, knowledge sharing, research, professional partnerships, digital innovation
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-lg">Our African Vision</h2>
          <p className="mt-2 text-sm font-medium text-brand-700 dark:text-sand-100">From Malawi to Africa</p>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">Malawi is our starting point, not our limit.</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Across Africa, communities have different foods, cultures, health challenges, lifestyles, and
            healthcare environments. We do not believe Africa should be treated as one uniform population.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Instead, our ambition is to build a platform that respects local differences while creating
            broader access to useful health knowledge. We want Thanzi Guide to demonstrate that
            African-built health technology can be relevant, credible, and capable of reaching the world.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Our roots remain in Malawi. Our perspective grows with Africa. Our purpose is universal.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Made for Humanity</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">Health is universal.</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            People everywhere need access to information that helps them understand their bodies, their
            food, and their wellbeing. While Thanzi Guide begins with the realities of Malawi and Africa,
            our ultimate purpose extends beyond geography.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We want to build knowledge and technology that can help people wherever they are.
          </p>
          <p className="mt-3 text-sm font-medium text-brand-700 dark:text-sand-100">
            Built in Malawi. Inspired by Africa. Made for Humanity.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Commitment to Evidence</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">Health information carries responsibility.</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We are committed to making our content as accurate, transparent, and evidence-informed as
            possible. Where appropriate, information is supported by credible references and professional
            knowledge. We aim to distinguish established evidence from general wellness information and
            avoid presenting uncertain information as fact.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We also recognize the limits of digital health information. Thanzi Guide does not replace a
            qualified healthcare professional. If you have symptoms, a medical condition, or concerns about
            your health, seek appropriate advice from a qualified healthcare professional.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Who Is Behind Thanzi Guide?</h2>
          <p className="mt-2 text-sm font-medium text-brand-700 dark:text-sand-100">Edison Taimu</p>
          <p className="text-xs text-brand-300 dark:text-brand-100">Founder</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide was founded by Edison Taimu, with a focus on bringing together nutrition, health
            education, and technology to create digital health resources that are relevant to Malawi and
            scalable to the wider world.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">The idea behind Thanzi Guide is simple:</p>
          <blockquote className="mt-2 border-l-2 border-brand-100 pl-4 text-sm italic text-brand-500 dark:border-ink-800 dark:text-brand-100">
            "Technology should not only make information faster to access. It should make useful
            information more relevant to the people it serves."
          </blockquote>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            As the platform grows, Thanzi Guide aims to work with qualified healthcare professionals,
            nutrition experts, researchers, educators, and other contributors to strengthen the quality,
            credibility, and usefulness of its content.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Where We Are Going</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide is being built as more than a website. Our ambition is to develop a trusted digital
            health and nutrition platform where people can:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-brand-500 dark:text-brand-100">
            <li>Discover reliable health information</li>
            <li>Understand nutrition and healthy eating</li>
            <li>Explore local and global foods</li>
            <li>Learn practical ways to live healthier</li>
            <li>Make more informed health decisions</li>
            <li>Access appropriate professional resources</li>
          </ul>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            As we grow, we hope to expand our content, collaborate with health professionals and
            institutions, incorporate more local and African data, and develop digital tools that address
            real health and nutrition needs.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            We are starting with Malawi. We are growing with Africa. And we are building for humanity.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Development Framework</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide sits at the intersection of three ambitions:
          </p>
          <dl className="mt-4 space-y-4 text-sm text-brand-500 dark:text-brand-100">
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">🇲🇼 Malawi 2063</dt>
              <dd className="mt-0.5">
                Contributing to a healthier, more knowledgeable, and self-reliant Malawi through human
                capital development, innovation, and locally relevant solutions.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">🌍 Sustainable Development Goals</dt>
              <dd className="mt-0.5">
                Contributing to global goals around health, nutrition, education, innovation, inclusion, and
                sustainable development.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-brand-700 dark:text-sand-100">🌎 A Global Vision</dt>
              <dd className="mt-0.5">
                Building technology and knowledge that can ultimately serve people beyond Malawi and Africa.
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="font-display text-lg">Our Purpose</h2>
          <p className="mt-2 text-sm text-brand-500 dark:text-brand-100">
            Thanzi Guide begins with a simple question: how can technology help people make better decisions
            about their health?
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">Our answer is to build tools and information that are:</p>
          <p className="mt-2 text-sm font-medium text-brand-700 dark:text-sand-100">
            Evidence-informed. Locally relevant. Accessible. Practical. Human-centered.
          </p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">Because development is ultimately about people.</p>
          <p className="mt-3 text-sm text-brand-500 dark:text-brand-100">
            And better-informed people can build healthier families, stronger communities, and a more
            sustainable future.
          </p>
        </section>

        <section className="text-center">
          <p className="text-sm font-medium text-brand-700 dark:text-sand-100">
            Better Information. Better Decisions. Better Health.
          </p>
          <p className="mt-4 text-sm text-brand-500 dark:text-brand-100">
            Built in Malawi.
            <br />
            Inspired by Africa.
            <br />
            Made for Humanity.
          </p>
          <p className="mt-4 text-lg">Thanzi Guide 🇲🇼🌍</p>
        </section>
      </div>
    </main>
  );
}
