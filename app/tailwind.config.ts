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
