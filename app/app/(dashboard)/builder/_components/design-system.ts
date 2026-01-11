/**
 * Unified Design System for Builder Dashboard
 * Ensures consistent colors, spacing, and styles across all pages
 * Based on: Slate backgrounds, Amber accents, Professional real estate dashboard design
 */

export const builderDesignSystem = {
  // Color Palette
  colors: {
    background: {
      primary: 'bg-slate-950',
      secondary: 'bg-slate-900/95',
      card: 'bg-slate-800/95',
      hover: 'bg-slate-800/60',
      overlay: 'bg-slate-900/98',
    },
    border: {
      default: 'border-amber-300/25',
      hover: 'border-amber-300/40',
      active: 'border-amber-400/50',
      divider: 'border-amber-300/20',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      tertiary: 'text-slate-400',
      accent: 'text-amber-300',
      muted: 'text-slate-500',
    },
    accent: {
      primary: 'bg-gradient-to-r from-amber-600 to-amber-500',
      hover: 'hover:from-amber-500 hover:to-amber-400',
      text: 'text-amber-300',
      glow: 'shadow-amber-500/30',
    },
  },
  
  // Spacing
  spacing: {
    section: 'p-6 sm:p-8',
    card: 'p-4 md:p-6',
    button: 'px-4 py-2.5',
    input: 'px-4 py-2.5',
  },
  
  // Effects
  effects: {
    glow: 'glow-border',
    shadow: 'shadow-2xl',
    backdrop: 'backdrop-blur-md',
    hoverGlow: 'hover:shadow-lg hover:shadow-amber-500/30',
  },
  
  // Container Styles
  containers: {
    // Main section container
    section: 'bg-slate-900/95 glow-border rounded-xl border border-amber-300/25 p-6 sm:p-8',
    
    // Card container
    card: 'bg-slate-800/95 glow-border rounded-lg border border-amber-300/25 p-4 md:p-6',
    
    // Sub-card container (nested)
    subCard: 'bg-slate-700/30 rounded-lg border border-amber-300/20 p-4',
    
    // Header container
    header: 'bg-gradient-to-r from-slate-800/50 to-transparent border-b border-amber-300/25 p-6',
  },
  
  // Button Styles
  buttons: {
    primary: 'px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5',
    secondary: 'px-4 py-2 bg-slate-700/50 border border-amber-300/25 text-white rounded-lg hover:bg-slate-700 hover:border-amber-300/40 transition-all',
    ghost: 'px-4 py-2 text-slate-300 rounded-lg hover:bg-slate-800/60 hover:text-white transition-all',
  },
  
  // Input Styles
  inputs: {
    default: 'w-full px-4 py-2.5 bg-slate-700/50 border border-amber-300/25 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-400/50 transition-all',
  },
  
  // Badge Styles
  badges: {
    default: 'px-3 py-1 rounded-full text-xs font-semibold',
    hot: 'bg-red-500/20 text-red-300 border border-red-500/30',
    warm: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    developing: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    cold: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    accent: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
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

