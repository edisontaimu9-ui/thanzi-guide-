// Hand-drawn stroke icons for the References "digital library" redesign.
// Kept as plain inline SVG rather than pulling in an icon package — the
// set is small and fixed (8 category glyphs + a few UI glyphs), so a new
// dependency wasn't worth it. Every icon shares the same 24x24 viewBox,
// stroke-based style, and `currentColor` so callers control color via
// className the same way the rest of the app does.

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

export function BookIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 5.5c2.2-1 5-1 8 .5v13c-3-1.5-5.8-1.5-8-.5v-13Z" />
      <path d="M20 5.5c-2.2-1-5-1-8 .5v13c3-1.5 5.8-1.5 8-.5v-13Z" />
    </svg>
  );
}

export function GuidelineIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3.5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v.5" />
      <path d="m8.5 12 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

export function ResearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 2.5h9l3 3v16H6z" />
      <path d="M15 2.5v3h3" />
      <path d="M9 12.5v4M12 10.5v6M15 14v3" />
    </svg>
  );
}

export function AcademicIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z" />
      <path d="M6.5 11v4.5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V11" />
      <path d="M21.5 9v6" />
    </svg>
  );
}

export function MalawiIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function GlobalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

export function DataIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 6v12c0 1.1 3.6 2 8 2s8-.9 8-2V6" />
      <ellipse cx="12" cy="6" rx="8" ry="2.5" />
      <path d="M4 12c0 1.1 3.6 2 8 2s8-.9 8-2" />
    </svg>
  );
}

export function ClinicalToolsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 3v6.5a4 4 0 0 0 8 0V3" />
      <path d="M10 9.5v3.5a5.5 5.5 0 0 0 11 0v-2" />
      <circle cx="20.5" cy="9" r="1.7" />
      <path d="M6 3H4.5M10 3H8.5" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </svg>
  );
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h4.4l1.6 2h7.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-11Z" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M15 4.5 7.5 12l7.5 7.5" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M6 2.5h9l3 3v16H6z" />
      <path d="M15 2.5v3h3" />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 6H5a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4" />
      <path d="M14 4h6v6M20 4l-9.5 9.5" />
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M12 3v12M8 11l4 4 4-4" />
      <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </svg>
  );
}
