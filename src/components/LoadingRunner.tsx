// A small branded "running" loading indicator — the interaction pattern
// (a character animated in place while content loads) takes inspiration
// from apps like Reddit, but the figure itself is original: a simple
// teal-and-gold runner matching Thanzi Guide's own palette, not any
// third-party mascot design.
interface LoadingRunnerProps {
  label?: string | null;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const SIZE_PX: Record<NonNullable<LoadingRunnerProps['size']>, number> = {
  sm: 28,
  md: 40,
  lg: 56
};

export function LoadingRunner({ label = 'Loading…', size = 'md', fullScreen = false, className = '' }: LoadingRunnerProps) {
  const px = SIZE_PX[size];

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-2 ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg width={px} height={Math.round(px * 1.2)} viewBox="0 0 48 58" aria-hidden="true">
        {/* ground shadow — stays put while the figure bobs above it */}
        <ellipse cx="24" cy="54" rx="9" ry="2" className="fill-brand-900/10 dark:fill-black/30" />

        <g style={{ animation: 'thanzi-runner-bob 0.6s ease-in-out infinite' }}>
          {/* head + torso */}
          <circle cx="24" cy="9" r="6" className="fill-brand-500 dark:fill-sand-100" />
          <rect x="21" y="16" width="6" height="15" rx="3" className="fill-brand-500 dark:fill-sand-100" />

          {/* arms — clay gold, swing opposite the same-side leg */}
          <line
            x1="21" y1="19" x2="13" y2="25"
            strokeWidth="4" strokeLinecap="round"
            className="stroke-clay-400"
            style={{ transformOrigin: '21px 19px', animation: 'thanzi-runner-arm-back 0.6s ease-in-out infinite' }}
          />
          <line
            x1="27" y1="19" x2="35" y2="13"
            strokeWidth="4" strokeLinecap="round"
            className="stroke-clay-400"
            style={{ transformOrigin: '27px 19px', animation: 'thanzi-runner-arm-front 0.6s ease-in-out infinite' }}
          />

          {/* legs */}
          <line
            x1="22" y1="31" x2="13" y2="43"
            strokeWidth="5" strokeLinecap="round"
            className="stroke-brand-700 dark:stroke-sand-50"
            style={{ transformOrigin: '22px 31px', animation: 'thanzi-runner-leg-back 0.6s ease-in-out infinite' }}
          />
          <line
            x1="26" y1="31" x2="35" y2="41"
            strokeWidth="5" strokeLinecap="round"
            className="stroke-brand-700 dark:stroke-sand-50"
            style={{ transformOrigin: '26px 31px', animation: 'thanzi-runner-leg-front 0.6s ease-in-out infinite' }}
          />
        </g>
      </svg>
      {label && <p className="text-sm text-brand-500 dark:text-brand-100">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>;
  }

  return content;
}
