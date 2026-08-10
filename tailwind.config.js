/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Lake Malawi teal (primary) + harvest gold (accent) + parchment
        // (background) — a local-inspired palette, deliberately not the
        // cream+terracotta combination that's become an AI-generated default.
        brand: {
          50: '#EAF3F1',
          100: '#CFE6E1',
          300: '#6EAFA5',
          500: '#0F6B63',
          700: '#0B4E48',
          900: '#072F2B'
        },
        clay: {
          400: '#D9A441',
          500: '#B8811F'
        },
        sand: {
          50: '#F2F1E6',
          100: '#E7E4D2'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Domine"', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
