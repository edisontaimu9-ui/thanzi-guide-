export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-sand-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="max-w-2xl text-sm text-brand-700">
          Thanzi Guide provides educational information about nutrition and
          health. It does not diagnose conditions and is not a substitute for
          advice from a qualified health professional — always consult a
          clinician for medical concerns.
        </p>
        <p className="mt-6 text-xs text-brand-300">
          © {new Date().getFullYear()} Thanzi Guide.
        </p>
      </div>
    </footer>
  );
}
