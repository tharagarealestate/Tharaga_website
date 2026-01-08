// ============================================
// THARAGA DESIGN SYSTEM
// Complete design tokens and utilities
// Based on psychological design principles
// ============================================

// ============================================
// COLORS
// ============================================
export const colors = {
  // Primary Brand Colors
  amber: {
    300: '#FCD34D', // Light amber (highlights)
    400: '#FBBF24', // Medium amber (hover states)
    500: '#F59E0B', // Primary amber (CTAs, accents)
    600: '#D97706', // Dark amber (active states)
  },
  slate: {
    700: '#334155', // Light slate (borders)
    800: '#1E293B', // Medium slate (cards, containers)
    900: '#0F172A', // Dark slate (backgrounds)
    950: '#020617', // Darkest slate (deep backgrounds)
  },
  
  // Semantic Colors
  success: {
    light: '#10B981',
    dark: '#059669',
  },
  error: {
    light: '#EF4444',
    dark: '#DC2626',
  },
  warning: {
    light: '#F59E0B',
    dark: '#D97706',
  },
  info: {
    light: '#3B82F6',
    dark: '#2563EB',
  },
  
  // Text Colors
  text: {
    primary: '#FFFFFF',      // White (headings)
    secondary: '#E2E8F0',    // Slate-200 (body)
    tertiary: '#94A3B8',     // Slate-400 (captions)
    muted: '#64748B',        // Slate-500 (disabled)
  },
} as const

// ============================================
// TYPOGRAPHY
// ============================================
export const typography = {
  // Headings
  h1: {
    fontSize: '3rem',      // 48px
    lineHeight: '1.2',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    mobile: {
      fontSize: '2rem',    // 32px
    },
    className: 'text-3xl sm:text-4xl font-bold text-white',
  },
  h2: {
    fontSize: '2rem',      // 32px
    lineHeight: '1.3',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    mobile: {
      fontSize: '1.5rem',  // 24px
    },
    className: 'text-2xl sm:text-3xl font-semibold text-white',
  },
  h3: {
    fontSize: '1.5rem',    // 24px
    lineHeight: '1.4',
    fontWeight: '600',
    mobile: {
      fontSize: '1.25rem', // 20px
    },
    className: 'text-xl sm:text-2xl font-semibold text-white',
  },
  
  // Body Text
  body: {
    fontSize: '1rem',      // 16px
    lineHeight: '1.6',
    fontWeight: '400',
    className: 'text-base text-slate-200',
  },
  bodyLarge: {
    fontSize: '1.125rem',  // 18px
    lineHeight: '1.6',
    fontWeight: '400',
    className: 'text-lg text-slate-200',
  },
  small: {
    fontSize: '0.875rem',  // 14px
    lineHeight: '1.5',
    fontWeight: '400',
    className: 'text-sm text-slate-400',
  },
} as const

// ============================================
// SPACING
// ============================================
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const

// Tailwind spacing classes
export const spacingClasses = {
  xs: 'p-1',      // 4px
  sm: 'p-2',      // 8px
  md: 'p-4',      // 16px
  lg: 'p-6',      // 24px
  xl: 'p-8',      // 32px
  '2xl': 'p-12',  // 48px
} as const

// ============================================
// SHADOWS & EFFECTS
// ============================================
export const effects = {
  // Glow Effects
  glow: {
    amber: '0 0 20px rgba(245, 158, 11, 0.3)',
    amberStrong: '0 0 40px rgba(245, 158, 11, 0.5)',
    emerald: '0 0 20px rgba(16, 185, 129, 0.3)',
    amberClass: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    amberStrongClass: 'shadow-[0_0_40px_rgba(245,158,11,0.5)]',
  },
  
  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  
  // Borders
  border: {
    default: '1px solid rgba(148, 163, 184, 0.2)',
    amber: '2px solid rgba(245, 158, 11, 0.3)',
    glow: '1px solid rgba(245, 158, 11, 0.25)',
    defaultClass: 'border border-slate-700/50',
    amberClass: 'border-2 border-amber-500/30',
    glowClass: 'border border-amber-300/25 glow-border',
  },
} as const

// ============================================
// ANIMATIONS
// ============================================
export const animations = {
  // Durations
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // Easing
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Transitions
  transition: {
    default: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Framer Motion variants
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
    },
  },
} as const

// ============================================
// LAYOUT PATTERNS
// ============================================
export const layout = {
  // Container
  container: {
    maxWidth: '1280px',
    padding: {
      mobile: '1rem',    // 16px
      tablet: '1.5rem',  // 24px
      desktop: '2rem',   // 32px
    },
    className: 'container mx-auto px-4 sm:px-6 lg:px-8',
  },
  
  // Section Spacing
  section: {
    padding: {
      mobile: '2rem',   // 32px
      desktop: '3rem',  // 48px
    },
    margin: {
      bottom: '3rem',   // 48px
    },
    className: 'py-8 sm:py-12 mb-12',
  },
  
  // Grid Systems
  grid: {
    two: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    three: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    four: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
  },
} as const

// ============================================
// BACKGROUND PATTERNS
// ============================================
export const backgrounds = {
  // Page Background
  page: {
    className: 'min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
  },
  
  // Card Background
  card: {
    className: 'bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95',
  },
  
  // Animated Orbs
  orbs: {
    amber: 'absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl',
    emerald: 'absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl',
  },
} as const

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get color class for semantic states
 */
export function getSemanticColor(type: 'success' | 'error' | 'warning' | 'info'): string {
  const colorMap = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
  }
  return colorMap[type]
}

/**
 * Get background color class for semantic states
 */
export function getSemanticBg(type: 'success' | 'error' | 'warning' | 'info'): string {
  const bgMap = {
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  }
  return bgMap[type]
}

/**
 * Get spacing class
 */
export function getSpacing(size: keyof typeof spacing): string {
  return spacingClasses[size] || spacingClasses.md
}

/**
 * Combine class names (utility)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// EXPORT ALL
// ============================================
export default {
  colors,
  typography,
  spacing,
  effects,
  animations,
  layout,
  backgrounds,
  getSemanticColor,
  getSemanticBg,
  getSpacing,
  cn,
}





