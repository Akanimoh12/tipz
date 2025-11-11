export const COLORS = {
  primary: '#000000',
  secondary: '#ffffff',
  accent: '#fafafa',
} as const;

export const SPACING = {
  '2xs': '0.25rem',
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  '2xl': '4rem',
  '3xl': '6rem',
} as const;

export const BORDER = {
  width: '3px',
  radius: '4px',
} as const;

export const SHADOW = {
  offset: '4px',
  offsetLg: '6px',
  offsetXl: '8px',
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    sans: '"Space Grotesk", "Inter", sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  fontSize: {
    h1: '3rem',
    h2: '2rem',
    h3: '1.5rem',
    h4: '1.25rem',
    bodyLg: '1.125rem',
    body: '1rem',
    bodySm: '0.875rem',
    caption: '0.75rem',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
