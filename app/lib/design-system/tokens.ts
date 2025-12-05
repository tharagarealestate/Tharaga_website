// lib/design-system/tokens.ts

export const THARAGA_TOKENS = {
  // Primary Colors
  colors: {
    primary: {
      champagneGold: '#D4AF37',
      champagneGoldLight: '#E8D48A',
      champagneGoldDark: '#B8960F',
      sapphireBlue: '#0F52BA',
      sapphireBlueLight: '#3D7DD8',
      sapphireBlueDark: '#0A3A82',
    },
    // Semantic Colors
    semantic: {
      success: '#10B981',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningLight: '#FEF3C7',
      error: '#EF4444',
      errorLight: '#FEE2E2',
      info: '#3B82F6',
      infoLight: '#DBEAFE',
    },
    // Neutral Palette
    neutral: {
      white: '#FFFFFF',
      gray50: '#F9FAFB',
      gray100: '#F3F4F6',
      gray200: '#E5E7EB',
      gray300: '#D1D5DB',
      gray400: '#9CA3AF',
      gray500: '#6B7280',
      gray600: '#4B5563',
      gray700: '#374151',
      gray800: '#1F2937',
      gray900: '#111827',
      black: '#000000',
    },
    // Glassmorphic Backgrounds
    glass: {
      light: 'rgba(255, 255, 255, 0.25)',
      medium: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(255, 255, 255, 0.08)',
      overlay: 'rgba(0, 0, 0, 0.4)',
    },
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #D4AF37 0%, #0F52BA 100%)',
    primaryReverse: 'linear-gradient(135deg, #0F52BA 0%, #D4AF37 100%)',
    gold: 'linear-gradient(135deg, #D4AF37 0%, #E8D48A 50%, #D4AF37 100%)',
    sapphire: 'linear-gradient(135deg, #0F52BA 0%, #3D7DD8 50%, #0F52BA 100%)',
    hero: 'linear-gradient(135deg, rgba(15, 82, 186, 0.9) 0%, rgba(212, 175, 55, 0.9) 100%)',
    card: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    pricing: {
      starter: 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)',
      professional: 'linear-gradient(135deg, #0F52BA 0%, #3D7DD8 100%)',
      enterprise: 'linear-gradient(135deg, #D4AF37 0%, #E8D48A 100%)',
    },
  },
  
  // Glassmorphic Effects
  glass: {
    blur: 'blur(20px)',
    blurStrong: 'blur(40px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderGold: '1px solid rgba(212, 175, 55, 0.3)',
    borderSapphire: '1px solid rgba(15, 82, 186, 0.3)',
    shadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    shadowElevated: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    shadowGold: '0 8px 32px 0 rgba(212, 175, 55, 0.2)',
    shadowSapphire: '0 8px 32px 0 rgba(15, 82, 186, 0.2)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "'Playfair Display', Georgia, serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    full: '9999px',
  },
  
  // Transitions
  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.3s ease',
    slow: 'all 0.5s ease',
    bounce: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Z-Index Scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;








