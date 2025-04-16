import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8975EA',
          50: '#f5f3fe',
          100: '#ebe7fc',
          200: '#d7d0fa',
          300: '#b9abf5',
          400: '#a48cef',
          500: '#8975EA', // Primary color
          600: '#7252e2',
          700: '#6142ce',
          800: '#5236a7',
          900: '#452f84',
        },
        dark: {
          100: '#2D2D2D',
          200: '#252525',
          300: '#1F1F1F',
          400: '#181818',
          500: '#121212',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
  darkMode: 'class',
};

export default config;
