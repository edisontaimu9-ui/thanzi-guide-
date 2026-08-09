export function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="font-display text-4xl text-brand-700">Thanzi Guide 🇲🇼</p>
      <p className="mt-4 text-brand-500">
        Learn about your health. Understand your food. Make better choices.
      </p>
      <p className="mt-8 text-sm text-brand-300">
        Foundation scaffold — homepage design comes in a later step.
      </p>
      <a href="/foods" className="mt-6 inline-block text-brand-500 underline">
        Browse Malawian foods →
      </a>
    </main>
  );
}
