/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#38bdf8',
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        surface: {
          DEFAULT: '#0f172a',
          muted: '#111c32',
          raised: '#1f2937',
          outline: '#1e293b',
        },
      },
      boxShadow: {
        banner: '0px 18px 40px rgba(8, 15, 34, 0.35)',
      },
      fontFamily: {
        sans: ['"InterVariable"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"General Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
