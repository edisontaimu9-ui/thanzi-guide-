// A branded loading indicator — a wallet with bills sliding in and out
// while it gives a light squish/bounce, adapted from a community CSS
// snippet (originally rupee-themed, brown/mint) into Thanzi Guide's own
// teal-and-gold palette with a Kwacha ("K") mark on the bills. Kept the
// component/export name LoadingRunner so every existing
// `import { LoadingRunner } from '@/components/LoadingRunner'` across
// the app keeps working without touching call sites — only the visual
// design changed.
//
// The design is built at a fixed 110x80 "device" size and scaled as a
// whole via CSS transform so the size prop still works the same way it
// did before, without needing to redo every pixel value per size.
interface LoadingRunnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const BASE_W = 110;
const BASE_H = 80;

const SCALE: Record<NonNullable<LoadingRunnerProps['size']>, number> = {
  sm: 0.6,
  md: 0.85,
  lg: 1.1
};

// Lake Malawi teal + harvest gold — the app's own brand colors (see
// tailwind.config.js) rather than the snippet's original brown/mint.
const WALLET_TOP = '#0F6B63'; // brand-500
const WALLET_BOTTOM = '#072F2B'; // brand-900
const BILL_BG = '#CFE6E1'; // brand-100
const BILL_BORDER = '#0F6B63'; // brand-500
const BADGE_BORDER = '#B8811F'; // clay-500
const TEXT_COLOR = '#F2F1E6'; // sand-50

const BILL_DELAYS = [0, 0.8, 1.6];

export function LoadingRunner({ size = 'md', fullScreen = false, className = '' }: LoadingRunnerProps) {
  const scale = SCALE[size];

  const content = (
    <div className={`flex items-center justify-center ${className}`} role="status">
      <div style={{ width: BASE_W * scale, height: BASE_H * scale }}>
        <div className="relative" style={{ width: BASE_W, height: BASE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {/* wallet back panel, sits behind the bills */}
          <div
            className="absolute rounded-t"
            style={{ bottom: 10, left: 5, width: 100, height: 45, background: WALLET_BOTTOM }}
          />

          {/* bills sliding up out of the wallet, staggered */}
          {BILL_DELAYS.map((delay, i) => (
            <div
              key={delay}
              className="absolute left-1/2 flex items-center justify-center rounded-sm opacity-0"
              style={{
                top: -30,
                width: 70,
                height: 40,
                transform: 'translateX(-50%)',
                background: BILL_BG,
                border: `1px solid ${BILL_BORDER}`,
                zIndex: i + 1,
                animation: 'thanzi-wallet-slide-in 4s ease-in-out infinite',
                animationDelay: `${delay}s`
              }}
            >
              <span
                className="absolute rounded-sm"
                style={{ inset: 3, border: `1px dashed ${BILL_BORDER}` }}
                aria-hidden="true"
              />
              <span
                className="flex items-center justify-center rounded-full text-xs font-bold"
                style={{ width: 20, height: 20, border: `2px solid ${BADGE_BORDER}`, color: BILL_BORDER, background: 'rgba(255,255,255,0.35)' }}
              >
                K
              </span>
            </div>
          ))}

          {/* wallet front flap, on top, with the loading text */}
          <div
            className="absolute bottom-0 left-0 flex items-center justify-center rounded-t-md rounded-b-xl shadow-md"
            style={{
              width: BASE_W,
              height: 52,
              zIndex: 10,
              background: `linear-gradient(180deg, ${WALLET_TOP}, ${WALLET_BOTTOM})`,
              animation: 'thanzi-wallet-bounce 4s ease-in-out infinite'
            }}
          >
            <span
              className="absolute rounded-t-sm rounded-b-lg"
              style={{ inset: 6, border: '1px dashed rgba(242,241,230,0.3)' }}
              aria-hidden="true"
            />
            <span className="text-sm font-semibold tracking-wide" style={{ color: TEXT_COLOR }}>
              Loading
              {[0, 0.1, 0.2].map((delay) => (
                <span
                  key={delay}
                  className="inline-block"
                  style={{ animation: 'thanzi-wallet-dot-wave 1.5s infinite', animationDelay: `${delay}s` }}
                >
                  .
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>;
  }

  return content;
}
