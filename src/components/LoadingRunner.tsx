// A branded loading indicator — a hamster running in a wheel, adapted
// from a community CSS snippet into Thanzi Guide. Kept the component/file
// name LoadingRunner for backward compatibility with existing imports
// across the app (`import { LoadingRunner } from '@/components/LoadingRunner'`)
// even though the design itself has changed a few times now.
//
// The whole design is built in em units off a single font-size, so the
// size prop just scales that font-size rather than needing a CSS transform.
import './LoadingRunner.css';

interface LoadingRunnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const FONT_SIZE: Record<NonNullable<LoadingRunnerProps['size']>, string> = {
  sm: '10px',
  md: '14px',
  lg: '20px'
};

export function LoadingRunner({ size = 'md', fullScreen = false, className = '' }: LoadingRunnerProps) {
  const content = (
    <div className={`flex items-center justify-center ${className}`} role="status">
      <div
        aria-label="Loading"
        className="wheel-and-hamster"
        style={{ fontSize: FONT_SIZE[size] }}
      >
        <div className="wheel" />
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear" />
              <div className="hamster__eye" />
              <div className="hamster__nose" />
            </div>
            <div className="hamster__limb hamster__limb--fr" />
            <div className="hamster__limb hamster__limb--fl" />
            <div className="hamster__limb hamster__limb--br" />
            <div className="hamster__limb hamster__limb--bl" />
            <div className="hamster__tail" />
          </div>
        </div>
        <div className="spoke" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>;
  }

  return content;
}
