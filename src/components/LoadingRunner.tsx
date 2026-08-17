// A branded loading indicator — a running person, in Thanzi's teal/gold
// palette, built from simple shapes (no naturalistic figure/likeness).
// Kept the component/file name LoadingRunner for backward compatibility
// with existing imports across the app.
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
      <div className="runner-loader" style={{ fontSize: FONT_SIZE[size] }}>
        <span className="runner-loader__dash" aria-hidden="true" />
        <span className="runner-loader__dash" aria-hidden="true" />
        <span className="runner-loader__dash" aria-hidden="true" />
        <div className="runner" aria-hidden="true">
          <div className="runner__head" />
          <div className="runner__torso" />
          <div className="runner__limb runner__arm--back" />
          <div className="runner__limb runner__arm--front" />
          <div className="runner__limb runner__leg--back" />
          <div className="runner__limb runner__leg--front" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{content}</div>;
  }

  return content;
}
