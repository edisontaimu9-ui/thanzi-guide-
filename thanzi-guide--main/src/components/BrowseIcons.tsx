// Stroke icons for the Browse hub. Same conventions as LibraryIcons.tsx —
// 24x24 viewBox, stroke-based, currentColor — so the two icon sets read as
// one family even though they live in separate files (Browse spans every
// content type in the app, Library is just the references shelf).

interface IconProps {
  className?: string;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export function FoodsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 12.5a8 8 0 0 1 16 0Z" />
      <path d="M2.5 12.5h19" />
      <path d="M12 12.5V16M8.5 12.5c0-2.5 1-4 3.5-4M15.5 12.5c0-2.5-1-4-3.5-4" />
    </svg>
  );
}

export function RecipesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3c-1.4 0-2.5 1.2-2.3 2.6.1.9-.3 1.6-1 2.1A5 5 0 1 0 15.3 7.7c-.7-.5-1.1-1.2-1-2.1C14.5 4.2 13.4 3 12 3Z" />
      <path d="M6.5 15.5h11l-1 4a1.5 1.5 0 0 1-1.5 1.2h-6a1.5 1.5 0 0 1-1.5-1.2l-1-4Z" />
    </svg>
  );
}

export function HealthIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 20.5S3.5 15.4 3.5 9.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8.5 2.4c0 6-8.5 11.1-8.5 11.1Z" />
      <path d="M6.5 11h2.4l1.3-2.4 1.6 4.8 1.3-2.4H15" />
    </svg>
  );
}

export function FitnessIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 8v8M18 8v8" />
      <path d="M3 10.5v3M21 10.5v3" />
      <path d="M6 12h12" />
      <rect x="3.8" y="9" width="2.4" height="6" rx="0.6" />
      <rect x="17.8" y="9" width="2.4" height="6" rx="0.6" />
    </svg>
  );
}

export function KidsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="6" r="2.6" />
      <path d="M7 20v-4.5A3.5 3.5 0 0 1 10.5 12h3a3.5 3.5 0 0 1 3.5 3.5V20" />
      <path d="M9 20h6" />
    </svg>
  );
}

export function WomenIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="7.5" r="4.5" />
      <path d="M12 12v8.5M8.5 17h7" />
    </svg>
  );
}

export function MenIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="10.5" cy="13.5" r="4.5" />
      <path d="M14 10l6-6M14.5 3.5H20v5.5" />
    </svg>
  );
}

export function SeniorsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="11" cy="5.5" r="2.4" />
      <path d="M8 10.5v3l-2 7M8 13.5h5.5l3 2.5" />
      <path d="M13 13.5l-1 7M15.5 20.5V16" />
    </svg>
  );
}

export function ArticlesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" />
      <path d="M7.5 8h9M7.5 11.5h9M7.5 15h5.5" />
    </svg>
  );
}

export function CoursesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M2.5 8 12 3.5 21.5 8 12 12.5 2.5 8Z" />
      <path d="M6.5 9.8V14c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V9.8" />
    </svg>
  );
}

export function ToolsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L4.5 16.5a1.7 1.7 0 0 0 2.4 2.4l5.4-5.4a3.5 3.5 0 0 1 4.6-4.6L14.3 11l-2-2 2.2-2.5Z" />
    </svg>
  );
}

export function CareIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21s-6.5-4.4-6.5-9.6C5.5 8.3 7.8 6 10.5 6c.9 0 1.7.3 2.5 1 .8-.7 1.6-1 2.5-1 2.7 0 5 2.3 5 5.4 0 5.2-6.5 9.6-6.5 9.6Z" />
      <path d="M9 11.5h2l1-2 1.5 4 1-2H16" />
    </svg>
  );
}
