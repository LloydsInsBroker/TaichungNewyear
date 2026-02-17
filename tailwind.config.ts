import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lucky-red': {
          DEFAULT: '#c41e3a',
          50: '#fef2f3',
          100: '#fde3e6',
          200: '#fdcbd2',
          300: '#faa5b0',
          400: '#f57088',
          500: '#eb4163',
          600: '#c41e3a',
          700: '#a91533',
          800: '#8e1530',
          900: '#7a162f',
        },
        'imperial-gold': {
          DEFAULT: '#cfb53b',
          50: '#fbf9eb',
          100: '#f5f0cc',
          200: '#ede09c',
          300: '#e1c963',
          400: '#cfb53b',
          500: '#c3a02a',
          600: '#a87d22',
          700: '#865c1e',
          800: '#714b20',
          900: '#613f21',
        },
        'cny-dark': '#1a0a0a',
        'cny-cream': '#fff8f0',
      },
      fontFamily: {
        serif: ['Noto Serif TC', 'serif'],
      },
      keyframes: {
        'lantern-swing': {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        'coin-fall': {
          '0%': { transform: 'translateY(-100%) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gold-shimmer': {
          '0%': { backgroundPosition: '200% center' },
          '100%': { backgroundPosition: '-200% center' },
        },
        'slot-scroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-100%)' },
        },
        'firework': {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.8' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'lantern-swing': 'lantern-swing 3s ease-in-out infinite',
        'coin-fall': 'coin-fall 3s linear infinite',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'bounce-in': 'bounce-in 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'gold-shimmer': 'gold-shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
