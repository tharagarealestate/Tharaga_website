"use client"

import { motion } from 'framer-motion'
import { builderDesignSystem } from './design-system'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'
import { ReactNode } from 'react'

interface StandardPageWrapperProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actionButton?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
  children: ReactNode
  className?: string
}

/**
 * StandardPageWrapper - Ensures EXACT consistency with main dashboard
 * Uses the same styling patterns as UnifiedDashboard.tsx
 */
export function StandardPageWrapper({
  title,
  subtitle,
  icon,
  actionButton,
  children,
  className = '',
}: StandardPageWrapperProps) {
  return (
    <div className={`${builderDesignSystem.layout.container} ${className}`}>
      {/* Header - EXACT from UnifiedDashboard */}
      <motion.div
        initial={builderDesignSystem.animations.pageHeader.initial}
        animate={builderDesignSystem.animations.pageHeader.animate}
        className={builderDesignSystem.spacing.header}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={builderDesignSystem.cards.iconContainer}>
                {icon}
              </div>
            )}
            <div>
              <h1 className={builderDesignSystem.typography.pageTitle}>
                {title}
              </h1>
              {subtitle && (
                <p className={builderDesignSystem.typography.pageSubtitle}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actionButton && (
            <PremiumButton
              variant="primary"
              size="sm"
              onClick={actionButton.onClick}
              icon={actionButton.icon}
            >
              {actionButton.label}
            </PremiumButton>
          )}
        </div>
      </motion.div>

      {/* Content - EXACT animation from UnifiedDashboard */}
      <motion.div
        initial={builderDesignSystem.animations.content.initial}
        animate={builderDesignSystem.animations.content.animate}
        transition={builderDesignSystem.animations.content.transition}
      >
        {children}
      </motion.div>
    </div>
  )
}

/**
 * StandardCard - Wrapper for content cards matching main dashboard style
 */
interface StandardCardProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  actionButton?: {
    label: string
    onClick: () => void
  }
  children: ReactNode
  className?: string
}

export function StandardCard({
  title,
  subtitle,
  icon,
  actionButton,
  children,
  className = '',
}: StandardCardProps) {
  return (
    <GlassCard
      {...builderDesignSystem.cards.contentCard.props}
      className={`${builderDesignSystem.cards.contentCard.props.className} ${className}`}
    >
      {/* Card Header - EXACT from UnifiedDashboard */}
      <div className={builderDesignSystem.cards.cardHeader}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={builderDesignSystem.cards.iconContainer}>
                {icon}
              </div>
            )}
            <div>
              <h2 className={builderDesignSystem.typography.sectionHeading}>
                {title}
              </h2>
              {subtitle && (
                <p className={builderDesignSystem.typography.sectionSubtitle}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actionButton && (
            <PremiumButton
              variant="primary"
              size="sm"
              onClick={actionButton.onClick}
            >
              {actionButton.label}
            </PremiumButton>
          )}
        </div>
      </div>

      {/* Card Body - EXACT from UnifiedDashboard */}
      <div className={builderDesignSystem.cards.cardBody}>
        {children}
      </div>
    </GlassCard>
  )
}

/**
 * EmptyState - Standard empty state matching main dashboard
 */
interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionButton?: {
    label: string
    onClick: () => void
    icon?: ReactNode
  }
}

export function EmptyState({ icon, title, description, actionButton }: EmptyStateProps) {
  return (
    <div className={builderDesignSystem.emptyStates.container}>
      <div className={builderDesignSystem.emptyStates.iconContainer}>
        <div className={builderDesignSystem.emptyStates.icon}>
          {icon}
        </div>
      </div>
      <h4 className={builderDesignSystem.emptyStates.title}>{title}</h4>
      <p className={builderDesignSystem.emptyStates.description}>{description}</p>
      {actionButton && (
        <PremiumButton
          variant="primary"
          size="md"
          onClick={actionButton.onClick}
          icon={actionButton.icon}
          iconPosition="right"
        >
          {actionButton.label}
        </PremiumButton>
      )}
    </div>
  )
}

/**
 * LoadingState - Standard loading state matching main dashboard
 */
interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className={builderDesignSystem.loadingStates.container}>
      <div className="text-center">
        <div className={builderDesignSystem.loadingStates.spinner}></div>
        <p className={builderDesignSystem.loadingStates.text}>{message}</p>
      </div>
    </div>
  )
}

