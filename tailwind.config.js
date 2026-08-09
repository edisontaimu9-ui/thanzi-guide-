/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Placeholder palette — will be finalized in the homepage/design-system step
        brand: {
          50: '#EAF4F0',
          100: '#CFE6DB',
          300: '#7CB8A0',
          500: '#0F5E4C',
          700: '#0A4438',
          900: '#062A22'
        },
        clay: {
          400: '#D98A5F',
          500: '#C46F42'
        },
        sand: {
          50: '#FBF8F2',
          100: '#F3EEE2'
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'serif']
      }
    }
  },
  plugins: []
};
