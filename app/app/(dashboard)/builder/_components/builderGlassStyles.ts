/**
 * Builder Dashboard - Shared glassmorphism styles
 *
 * Central place to keep all glass-related Tailwind class strings
 * so Overview, Viewings, Negotiations, Contracts, Analytics, etc.
 * stay visually in sync.
 */

// Main, highly interactive cards (used heavily on Overview)
export const builderGlassPrimary =
  'relative group backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 overflow-hidden'

// Secondary content cards
export const builderGlassSecondary =
  'backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-lg'

// Interactive tiles / buttons
export const builderGlassInteractive =
  'relative group backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:bg-white/[0.15] overflow-hidden'

// Small pill badges
export const builderGlassBadge =
  'backdrop-blur-sm bg-gold-500/20 glow-border rounded-full px-4 py-2 text-xs font-medium text-gold-300'

// Section-level analytic panels (used by Ultra Automation components)
export const builderGlassPanel =
  'bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]'

export const builderGlassSubPanel =
  'bg-white/[0.02] backdrop-blur-[12px] border border-white/[0.05] rounded-xl'




