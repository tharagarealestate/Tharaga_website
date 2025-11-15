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
        // Premium palette using CSS variables (RGB for opacity utilities)
        primary: {
          950: 'rgb(var(--primary-950) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
        },
        gold: {
          900: 'rgb(var(--gold-900) / <alpha-value>)',
          800: 'rgb(var(--gold-800) / <alpha-value>)',
          700: 'rgb(var(--gold-700) / <alpha-value>)',
          600: 'rgb(var(--gold-600) / <alpha-value>)',
          500: 'rgb(var(--gold-500) / <alpha-value>)',
          400: 'rgb(var(--gold-400) / <alpha-value>)',
          300: 'rgb(var(--gold-300) / <alpha-value>)',
          200: 'rgb(var(--gold-200) / <alpha-value>)',
        },
        emerald: {
          900: 'rgb(var(--emerald-900) / <alpha-value>)',
          800: 'rgb(var(--emerald-800) / <alpha-value>)',
          700: 'rgb(var(--emerald-700) / <alpha-value>)',
          600: 'rgb(var(--emerald-600) / <alpha-value>)',
          500: 'rgb(var(--emerald-500) / <alpha-value>)',
          400: 'rgb(var(--emerald-400) / <alpha-value>)',
          300: 'rgb(var(--emerald-300) / <alpha-value>)',
        },
        gray: {
          950: 'rgb(var(--gray-950) / <alpha-value>)',
          900: 'rgb(var(--gray-900) / <alpha-value>)',
          800: 'rgb(var(--gray-800) / <alpha-value>)',
          700: 'rgb(var(--gray-700) / <alpha-value>)',
          600: 'rgb(var(--gray-600) / <alpha-value>)',
          500: 'rgb(var(--gray-500) / <alpha-value>)',
          400: 'rgb(var(--gray-400) / <alpha-value>)',
          300: 'rgb(var(--gray-300) / <alpha-value>)',
          200: 'rgb(var(--gray-200) / <alpha-value>)',
          100: 'rgb(var(--gray-100) / <alpha-value>)',
          50: 'rgb(var(--gray-50) / <alpha-value>)',
        },
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',

        // Backwards-compat for existing classes in layouts
        canvas: {
          DEFAULT: 'rgb(var(--gray-50) / <alpha-value>)',
          subtle: 'rgb(var(--gray-100) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--gray-900) / <alpha-value>)',
          muted: 'rgb(var(--gray-600) / <alpha-value>)',
          onEmphasis: 'rgb(255 255 255 / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--gray-300) / <alpha-value>)',
          muted: 'rgb(var(--gray-200) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--primary-600) / <alpha-value>)',
          emphasis: 'rgb(var(--primary-700) / <alpha-value>)',
          muted: 'rgb(var(--primary-600) / 0.20)',
        },
      },
      fontFamily: {
        ui: ['var(--font-body)'],
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        gold: 'var(--shadow-gold)',
        emerald: 'var(--shadow-emerald)',
        // legacy keys
        card: 'var(--shadow-sm)',
        cardMd: 'var(--shadow-md)',
      },
      backgroundImage: {
        hero: 'var(--gradient-hero)',
        'gradient-gold': 'var(--gradient-gold)',
        'gradient-emerald': 'var(--gradient-emerald)',
        card: 'var(--gradient-card)',
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
      // Glassmorphism utilities
      backdropBlur: {
        xs: '2px',
        '4xl': '72px',
      },
      backdropSaturate: {
        180: '180%',
      },
      // Premium animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 20s infinite ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(50px, -50px) rotate(90deg)' },
          '50%': { transform: 'translate(100px, 0) rotate(180deg)' },
          '75%': { transform: 'translate(50px, 50px) rotate(270deg)' },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 20px rgba(102, 126, 234, 0.5)',
          },
          '100%': { 
            boxShadow: '0 0 40px rgba(102, 126, 234, 0.8), 0 0 60px rgba(118, 75, 162, 0.5)',
          },
        },
      },
      // Premium shadows
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        'glow-indigo': '0 0 20px rgba(102, 126, 234, 0.5)',
        'glow-purple': '0 0 20px rgba(118, 75, 162, 0.5)',
      },
    },
  },
  plugins: [
    // Custom plugin for glassmorphism
    function({ addUtilities }: any) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
}

export default config
