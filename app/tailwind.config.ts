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
        deepBlue: '#001F4D',
        gold: '#D4AF37',
        brandWhite: '#FFFFFF',
        burgundy: '#6e0d25',
        burgundyHover: '#9b213f',
        cream: '#f7efe7',
      },
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui'],
        poppins: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        subtle: '0 2px 16px rgba(0, 31, 77, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
