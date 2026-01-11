/**
 * Unified Design System for Builder Dashboard
 * EXACT styling from main dashboard page for perfect consistency
 * Based on: UnifiedDashboard.tsx styling patterns
 */

import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

export const builderDesignSystem = {
  // Layout - EXACT from layout.tsx
  layout: {
    // Main background - EXACT from layout
    background: 'bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95',
    
    // Main container spacing - EXACT from UnifiedDashboard
    container: 'w-full space-y-8',
    
    // Content padding - EXACT from layout
    contentPadding: 'px-6 lg:px-8 xl:px-12 pt-8 pb-8 sm:pb-12',
  },

  // Typography - EXACT from UnifiedDashboard
  typography: {
    // Page title (Welcome back style)
    pageTitle: 'text-2xl sm:text-3xl font-bold text-white mb-2',
    
    // Page subtitle
    pageSubtitle: 'text-slate-300 text-base sm:text-lg',
    
    // Section heading (Recent Leads, My Properties style)
    sectionHeading: 'text-xl font-bold text-white',
    
    // Section subtitle
    sectionSubtitle: 'text-sm text-slate-300',
    
    // Card title
    cardTitle: 'text-lg font-bold text-white mb-1',
    
    // Card description
    cardDescription: 'text-sm text-slate-300',
    
    // Body text
    body: 'text-base text-slate-300',
    
    // Muted text
    muted: 'text-slate-400',
    
    // Small text
    small: 'text-sm text-slate-400',
  },

  // Cards - EXACT from UnifiedDashboard (using GlassCard)
  cards: {
    // Main content card (Recent Leads, My Properties style)
    contentCard: {
      component: GlassCard,
      props: {
        variant: 'dark' as const,
        glow: true,
        className: 'overflow-hidden desktop-card min-w-0 max-w-full h-full flex flex-col',
      },
    },
    
    // Stat card (metric cards style)
    statCard: {
      component: GlassCard,
      props: {
        variant: 'dark' as const,
        glow: true,
        hover: true,
        className: 'relative overflow-hidden group cursor-pointer',
      },
    },
    
    // Section card (Quick Actions style)
    sectionCard: {
      component: GlassCard,
      props: {
        variant: 'dark' as const,
        glow: true,
        className: 'overflow-hidden',
      },
    },
    
    // Card header styling - EXACT from UnifiedDashboard
    cardHeader: 'border-b border-amber-300/25 p-6 sm:p-8',
    
    // Card body styling
    cardBody: 'p-6 sm:p-8',
    
    // Icon container - EXACT from UnifiedDashboard
    iconContainer: 'w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center',
    
    // Icon style
    icon: 'w-5 h-5 text-amber-300',
  },

  // Grids - EXACT from UnifiedDashboard
  grids: {
    // Stats grid (4 columns)
    statsGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full desktop-grid-item',
    
    // Content grid (2 columns)
    contentGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 w-full',
    
    // Single column
    singleColumn: 'w-full',
  },

  // Spacing - EXACT from UnifiedDashboard
  spacing: {
    // Main container vertical spacing
    container: 'space-y-8',
    
    // Section spacing
    section: 'mb-6',
    
    // Card internal spacing
    card: 'space-y-3',
    
    // Header spacing
    header: 'mb-6',
  },

  // Colors - EXACT from UnifiedDashboard
  colors: {
    background: {
      // Layout background
      layout: 'bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95',
      
      // Icon container
      iconContainer: 'bg-slate-700/50',
      
      // Empty state icon
      emptyIcon: 'bg-slate-700/30',
    },
    border: {
      // Card header divider
      cardDivider: 'border-amber-300/25',
      
      // Default border
      default: 'border-amber-300/25',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-400',
      muted: 'text-slate-500',
      accent: 'text-amber-300',
    },
  },

  // Animations - EXACT from UnifiedDashboard
  animations: {
    // Page header animation
    pageHeader: {
      initial: { opacity: 0, y: -10 },
      animate: { opacity: 1, y: 0 },
    },
    
    // Content animation
    content: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4 },
    },
    
    // Staggered item animation
    item: (index: number) => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: index * 0.05 },
    }),
    
    // Stat card animation
    statCard: (index: number) => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: index * 0.1, duration: 0.4 },
    }),
  },

  // Empty States - EXACT from UnifiedDashboard
  emptyStates: {
    container: 'text-center py-16 px-6',
    iconContainer: 'p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center',
    icon: 'h-10 w-10 text-slate-500',
    title: 'text-xl font-semibold text-white mb-2',
    description: 'text-slate-400 mb-6',
  },

  // Loading States - EXACT from UnifiedDashboard
  loadingStates: {
    container: 'flex items-center justify-center min-h-[400px]',
    spinner: 'animate-spin rounded-full h-12 w-12 border-b-2 border-amber-300 mx-auto mb-4',
    text: 'text-slate-400',
  },
}

// Helper functions for easy usage
export const getSectionClassName = () => builderDesignSystem.containers.section
export const getCardClassName = () => builderDesignSystem.containers.card
export const getSubCardClassName = () => builderDesignSystem.containers.subCard

export const getPrimaryButtonClassName = () => builderDesignSystem.buttons.primary
export const getSecondaryButtonClassName = () => builderDesignSystem.buttons.secondary
export const getGhostButtonClassName = () => builderDesignSystem.buttons.ghost

export const getInputClassName = () => builderDesignSystem.inputs.default

export const getBadgeClassName = (type: 'hot' | 'warm' | 'developing' | 'cold' | 'accent' = 'accent') => 
  `${builderDesignSystem.badges.default} ${builderDesignSystem.badges[type]}`

