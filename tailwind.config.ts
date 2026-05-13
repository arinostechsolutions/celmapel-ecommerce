import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
        },
        accent: {
          50:  'var(--accent-50)',
          100: 'var(--accent-100)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 16px 0 rgb(0 0 0 / 0.12)',
        'modal': '0 20px 60px -10px rgb(0 0 0 / 0.25)',
      },
      animation: {
        'slide-in-right':    'slideInRight 0.3s ease-out',
        'slide-out-right':   'slideOutRight 0.3s ease-in',
        'fade-in':           'fadeIn 0.2s ease-out',
        'bounce-once':       'bounceOnce 0.4s ease-out',
        'ken-burns':         'kenBurns 6s ease-out forwards',
        'content-fade-up':   'contentFadeUp 0.6s ease-out forwards',
        'progress':          'progress linear forwards',
      },
      keyframes: {
        slideInRight: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceOnce: {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.4)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        kenBurns: {
          '0%':   { transform: 'scale(1)    translateX(0px)' },
          '100%': { transform: 'scale(1.08) translateX(-12px)' },
        },
        contentFadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progress: {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
