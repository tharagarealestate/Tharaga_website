import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './features/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontSize: {
        p: ['var(--size-p)', { lineHeight: 'var(--leading-p)' }],
        h6: ['var(--size-h6)', { letterSpacing: 'var(--tracking-h6)' }],
        h5: ['var(--size-h5)'],
        h4: ['var(--size-h4)', { lineHeight: 'var(--leading-h4)' }],
        h3: ['var(--size-h3)', { letterSpacing: 'var(--tracking-h3)' }],
        h2: ['var(--size-h2)', { lineHeight: 'var(--leading-h2)' }],
        h1: ['var(--size-h1)', { lineHeight: 'var(--leading-h1)', letterSpacing: 'var(--tracking-h1)' }],
      },
      letterSpacing: {
        h6: 'var(--tracking-h6)',
        h3: 'var(--tracking-h3)',
        h1: 'var(--tracking-h1)',
      },
      lineHeight: {
        p: 'var(--leading-p)',
        h4: 'var(--leading-h4)',
        h2: 'var(--leading-h2)',
        h1: 'var(--leading-h1)',
      },
      colors: {
        // Primer-like tokens mapped into Tailwind
        canvas: 'var(--color-canvas-default)',
        canvasSubtle: 'var(--color-canvas-subtle)',
        fg: 'var(--color-fg-default)',
        fgMuted: 'var(--color-fg-muted)',
        onEmphasis: 'var(--color-fg-on-emphasis)',
        border: 'var(--color-border-default)',
        borderMuted: 'var(--color-border-muted)',
        accent: 'var(--color-accent-fg)',
        accentEmphasis: 'var(--color-accent-emphasis)',
        accentMuted: 'var(--color-accent-muted)',
        success: 'var(--color-success-fg)',
        successEmphasis: 'var(--color-success-emphasis)',
        danger: 'var(--color-danger-fg)',
        dangerEmphasis: 'var(--color-danger-emphasis)',
        attention: 'var(--color-attention-fg)',
        attentionEmphasis: 'var(--color-attention-emphasis)',
      },
      fontFamily: {
        ui: ['Manrope', 'Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Plus Jakarta Sans', 'Manrope', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        subtle: 'var(--shadow-sm)',
        card: 'var(--shadow-sm)',
        cardMd: 'var(--shadow-md)',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          lg: '1.5rem',
          xl: '2rem',
        },
      },
      screens: {
        md: '720px',
        lg: '1024px',
        xl: '1280px',
      },
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}

export default config
