import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#FFFEF9', // Soft cream/milk white
        accent: '#F5F4EF', // Slightly darker cream for cards
        brand: '#FF6B9D', // Pink/rose for primary CTAs
      },
      fontFamily: {
        sans: ['"Space Grotesk"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0em', fontWeight: '700' }],
        'h4': ['1.25rem', { lineHeight: '1.4', letterSpacing: '0em', fontWeight: '700' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0em', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
      },
      boxShadow: {
        brutalist: '4px 4px 0px 0px rgba(0, 0, 0, 1)',
        'brutalist-lg': '6px 6px 0px 0px rgba(0, 0, 0, 1)',
        'brutalist-xl': '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        none: 'none',
      },
      borderWidth: {
        DEFAULT: '3px',
        0: '0',
        2: '2px',
        3: '3px',
        4: '4px',
      },
      borderRadius: {
        none: '0',
        brutalist: '4px',
        DEFAULT: '4px',
      },
      spacing: {
        '2xs': '0.25rem',
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
        '3xl': '6rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
} satisfies Config;
