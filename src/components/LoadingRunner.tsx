// A small branded "running" loading indicator — a figure that stays in
// place and cycles a running motion (bob + swinging arms/legs), the way
// Reddit's own splash/loading animation keeps its mascot centered and
// running in place rather than moving across the screen. The figure
// itself is original: a teal-and-gold runner matching Thanzi Guide's own
// palette, not a copy of any third-party mascot design. No visible text —
// a screen-reader-only label is kept for accessibility.
interface LoadingRunnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const SIZE_PX: Record<NonNullable<LoadingRunnerProps['size']>, number> = {
  sm: 28,
  md: 40,
  lg: 56
};

export function LoadingRunner({ size = 'md', fullScreen = false, className = '' }: LoadingRunnerProps) {
  const px = SIZE_PX[size];

  const content = (
    <div className={`flex items-center justify-center ${className}`} role="status">
      <span className="sr-only">Loading</span>
      <svg width={px} height={Math.round(px * 1.2)} viewBox="0 0 48 58" aria-hidden="true">
        {/* ground shadow — stays put while the figure bobs above it */}
        <ellipse cx="24" cy="54" rx="9" ry="2" className="fill-brand-900/10 dark:fill-black/30" />

        <g style={{ animation: 'thanzi-runner-bob 0.5s ease-in-out infinite' }}>
          <circle cx="24" cy="9" r="6" className="fill-brand-500 dark:fill-sand-100" />
          <rect x="21" y="16" width="6" height="15" rx="3" className="fill-brand-500 dark:fill-sand-100" />

          <line
            x1="21" y1="19" x2="13" y2="25"
            strokeWidth="4" strokeLinecap="round"
            className="stroke-clay-400"
            style={{ transformOrigin: '21px 19px', animation: 'thanzi-runner-arm-back 0.5s ease-in-out infinite' }}
          />
          <line
            x1="27" y1="19" x2="35" y2="13"
            strokeWidth="4" strokeLinecap="round"
            className="stroke-clay-400"
            style={{ transformOrigin: '27px 19px', animation: 'thanzi-runner-arm-front 0.5s ease-in-out infinite' }}
          />

          <line
            x1="22" y1="31" x2="13" y2="43"
            strokeWidth="5" strokeLinecap="round"
            className="stroke-brand-700 dark:stroke-sand-50"
            style={{ transformOrigin: '22px 31px', animation: 'thanzi-runner-leg-back 0.5s ease-in-out infinite' }}
          />
          <line
            x1="26" y1="31" x2="35" y2="41"
            strokeWidth="5" strokeLinecap="round"
            className="stroke-brand-700 dark:stroke-sand-50"
            style={{ transformOrigin: '26px 31px', animation: 'thanzi-runner-leg-front 0.5s ease-in-out infinite' }}
          />
        </g>
      </svg>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>;
  }

  return content;
}
