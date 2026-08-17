// A small branded "running" loading indicator — the character runs
// left-to-right across a track and loops, the way Reddit's spinner does.
// The figure itself is original: a teal-and-gold runner matching Thanzi
// Guide's own palette, not a copy of any third-party mascot design. No
// visible text — a screen-reader-only label is kept for accessibility.
interface LoadingRunnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<LoadingRunnerProps['size']>, { track: number; height: number; icon: number; duration: string }> = {
  sm: { track: 80, height: 34, icon: 28, duration: '1.1s' },
  md: { track: 120, height: 46, icon: 40, duration: '1.3s' },
  lg: { track: 160, height: 62, icon: 56, duration: '1.5s' }
};

export function LoadingRunner({ size = 'md', fullScreen = false, className = '' }: LoadingRunnerProps) {
  const { track, height, icon, duration } = SIZES[size];
  const startX = -icon;
  const endX = track;

  const content = (
    <div className={`flex items-center justify-center ${className}`} role="status">
      <span className="sr-only">Loading</span>
      <div className="relative overflow-hidden" style={{ width: track, height }} aria-hidden="true">
        <svg
          width={icon}
          height={Math.round(icon * 1.2)}
          viewBox="0 0 48 58"
          className="absolute top-0"
          style={
            {
              animation: `thanzi-runner-move ${duration} linear infinite`,
              '--runner-start': `${startX}px`,
              '--runner-end': `${endX}px`
            } as React.CSSProperties
          }
        >
          {/* ground shadow travels with the runner but doesn't bob */}
          <ellipse cx="24" cy="54" rx="9" ry="2" className="fill-brand-900/10 dark:fill-black/30" />

          <g style={{ animation: 'thanzi-runner-bob 0.35s ease-in-out infinite' }}>
            <circle cx="24" cy="9" r="6" className="fill-brand-500 dark:fill-sand-100" />
            <rect x="21" y="16" width="6" height="15" rx="3" className="fill-brand-500 dark:fill-sand-100" />

            <line
              x1="21" y1="19" x2="13" y2="25"
              strokeWidth="4" strokeLinecap="round"
              className="stroke-clay-400"
              style={{ transformOrigin: '21px 19px', animation: 'thanzi-runner-arm-back 0.35s ease-in-out infinite' }}
            />
            <line
              x1="27" y1="19" x2="35" y2="13"
              strokeWidth="4" strokeLinecap="round"
              className="stroke-clay-400"
              style={{ transformOrigin: '27px 19px', animation: 'thanzi-runner-arm-front 0.35s ease-in-out infinite' }}
            />

            <line
              x1="22" y1="31" x2="13" y2="43"
              strokeWidth="5" strokeLinecap="round"
              className="stroke-brand-700 dark:stroke-sand-50"
              style={{ transformOrigin: '22px 31px', animation: 'thanzi-runner-leg-back 0.35s ease-in-out infinite' }}
            />
            <line
              x1="26" y1="31" x2="35" y2="41"
              strokeWidth="5" strokeLinecap="round"
              className="stroke-brand-700 dark:stroke-sand-50"
              style={{ transformOrigin: '26px 31px', animation: 'thanzi-runner-leg-front 0.35s ease-in-out infinite' }}
            />
          </g>
        </svg>
      </div>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>;
  }

  return content;
}
