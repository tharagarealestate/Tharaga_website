/**
 * DESIGN SYSTEM GUIDE
 * 
 * This file documents the consistent design system used across all builder dashboard pages.
 * All pages should use these components for a unified, premium look.
 * 
 * Based on the billing/subscription page design.
 */

// =============================================
// CORE COMPONENTS
// =============================================

/**
 * GlassCard - Use for all card containers
 * 
 * Variants:
 * - 'light' - Standard cards
 * - 'medium' - Secondary cards
 * - 'dark' - Subtle cards
 * - 'gold' - Premium/featured cards
 * - 'sapphire' - Special cards
 * 
 * Usage:
 * ```tsx
 * import { GlassCard } from '@/components/ui/glass-card'
 * 
 * <GlassCard variant="gold" glow>
 *   <h3>Premium Feature</h3>
 * </GlassCard>
 * ```
 */
export { GlassCard } from '@/components/ui/glass-card'

/**
 * PremiumButton - Use for all buttons
 * 
 * Variants:
 * - 'primary' - Main actions (gold to blue gradient)
 * - 'secondary' - Secondary actions
 * - 'gold' - Premium actions
 * - 'sapphire' - Special actions
 * - 'ghost' - Subtle actions
 * - 'outline' - Outlined buttons
 * - 'danger' - Destructive actions
 * 
 * Usage:
 * ```tsx
 * import { PremiumButton } from '@/components/ui/premium-button'
 * 
 * <PremiumButton variant="primary" size="lg" shimmer>
 *   Upgrade Now
 * </PremiumButton>
 * ```
 */
export { PremiumButton } from '@/components/ui/premium-button'

/**
 * BuilderPageWrapper - Use for all page layouts
 * 
 * Provides consistent page structure with title, description, and container.
 * 
 * Usage:
 * ```tsx
 * import { BuilderPageWrapper } from '../_components/BuilderPageWrapper'
 * 
 * <BuilderPageWrapper
 *   title="Page Title"
 *   description="Page description"
 *   noContainer={false}
 * >
 *   {/* Page content */}
 * </BuilderPageWrapper>
 * ```
 */
export { BuilderPageWrapper } from './BuilderPageWrapper'

// =============================================
// DESIGN TOKENS
// =============================================

export const DESIGN_TOKENS = {
  colors: {
    primary: '#D4AF37', // Gold
    secondary: '#0F52BA', // Sapphire Blue
    background: {
      dark: 'bg-slate-950',
      card: 'bg-slate-800/95',
      glass: 'bg-slate-800/50 backdrop-blur-sm',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      muted: 'text-slate-400',
      accent: 'text-amber-300',
    },
    border: {
      default: 'border-amber-300/25',
      glow: 'glow-border border-amber-300/25',
    },
  },
  spacing: {
    page: 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
    card: 'p-6 sm:p-8',
    section: 'mb-6 sm:mb-8',
  },
  typography: {
    h1: 'text-2xl sm:text-3xl font-bold text-white',
    h2: 'text-xl sm:text-2xl font-semibold text-white',
    h3: 'text-lg sm:text-xl font-semibold text-white',
    body: 'text-base text-slate-300',
    small: 'text-sm text-slate-400',
  },
  effects: {
    glow: 'glow-border shadow-[0_0_60px_rgba(251,191,36,0.1)]',
    hover: 'hover:bg-slate-700/30 transition-all duration-300',
  },
}

// =============================================
// COMMON PATTERNS
// =============================================

/**
 * Standard Card Pattern
 */
export const StandardCardPattern = {
  container: 'bg-slate-800/95 rounded-xl border-2 border-amber-300/20 p-6',
  header: 'mb-4 pb-4 border-b border-amber-300/10',
  title: 'text-lg font-semibold text-white',
  content: 'text-slate-300',
}

/**
 * Stat Card Pattern
 */
export const StatCardPattern = {
  container: 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-xl border border-amber-300/20 p-6',
  value: 'text-2xl font-bold text-white',
  label: 'text-sm text-slate-400',
  trend: 'text-xs font-semibold',
}

/**
 * Action Button Pattern
 */
export const ActionButtonPattern = {
  primary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all',
  secondary: 'bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/70 transition-colors',
}













