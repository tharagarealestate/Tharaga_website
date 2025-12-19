/**
 * Builder Dashboard - Common Background and Container Styles
 * 
 * Central place for all common design elements that should be consistent
 * across all builder dashboard sections (Overview, Viewings, Negotiations, etc.)
 * 
 * This ensures no white backgrounds and consistent glassmorphic design throughout.
 */

/**
 * Main page background - Dark gradient consistent across all sections
 * Use this as the wrapper background for all builder dashboard pages
 */
export const builderPageBackground = 
  'min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-950'

/**
 * Main content container - Dark glassmorphic container
 * Wraps all section content to ensure consistent dark appearance
 */
export const builderContentContainer = 
  'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'

/**
 * Section wrapper - Dark glassmorphic panel for section content
 * Use this to wrap individual sections to ensure they match Overview design
 */
export const builderSectionWrapper = 
  'bg-white/[0.03] backdrop-blur-[20px] border border-white/[0.08] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6'
<<<<<<< HEAD
=======

/**
 * Page header container - For section headers
 */
export const builderPageHeader = 
  'mb-6 space-y-4'

/**
 * Page title styling
 */
export const builderPageTitle = 
  'font-display text-4xl font-bold text-white sm:text-5xl lg:text-[3.25rem]'

/**
 * Page description styling
 */
export const builderPageDescription = 
  'mt-3 max-w-2xl text-base text-blue-100/80 sm:text-lg'
>>>>>>> 6ea032dba0a9adbd68fc37308bf15ab210292842
