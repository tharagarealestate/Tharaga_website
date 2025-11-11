import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Text,
} from '@react-email/components'

export interface LeadNotificationEmailProps {
  builderName?: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  leadScore: number
  leadCategory: string
  propertyTitle: string
  budgetRange?: string
  preferredLocation?: string
  leadUrl: string
  engagementSummary?: string
  siteUrl?: string
  recommendedActions?: string[]
}

const clampScore = (score: number) => Math.min(Math.max(score, 0), 10)

const categoryPalette: Record<
  string,
  { color: string; accent: string; emoji: string }
> = {
  hot: { color: '#F97316', accent: 'rgba(249, 115, 22, 0.15)', emoji: '🔥' },
  warm: { color: '#FACC15', accent: 'rgba(250, 204, 21, 0.15)', emoji: '⚡' },
  cold: { color: '#38BDF8', accent: 'rgba(56, 189, 248, 0.15)', emoji: '❄️' },
  default: { color: '#A855F7', accent: 'rgba(168, 85, 247, 0.15)', emoji: '📊' },
}

const getCategoryPreset = (category: string) => {
  const key = category?.toLowerCase?.() ?? 'default'
  return categoryPalette[key] ?? categoryPalette.default
}

export const LeadNotificationEmail: React.FC<LeadNotificationEmailProps> = ({
  builderName = 'Builder',
  leadName,
  leadEmail,
  leadPhone,
  leadScore,
  leadCategory,
  propertyTitle,
  budgetRange,
  preferredLocation,
  leadUrl,
  engagementSummary,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tharaga.co.in',
  recommendedActions = [
    'Reach out within 5 minutes for the strongest conversion odds.',
    `Reference their interest in ${propertyTitle} to build instant rapport.`,
    'Offer to schedule a guided site visit at their convenience.',
  ],
}) => {
  const palette = getCategoryPreset(leadCategory)
  const scoreValue = clampScore(Number.isFinite(leadScore) ? leadScore : 0)
  const scorePercentage = `${scoreValue * 10}%`

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.badgeWrapper}>
            <Text
              style={{
                ...styles.badge,
                backgroundColor: palette.accent,
                color: palette.color,
              }}
            >
              {palette.emoji} New {leadCategory.toUpperCase()} Lead
            </Text>
          </Section>

          <Section style={styles.content}>
            <Text style={styles.greeting}>Hi {builderName},</Text>

            <Text style={styles.paragraph}>
              Our AI identified a{' '}
              <strong style={{ color: palette.color }}>
                {leadCategory.toLowerCase()}
              </strong>{' '}
              quality lead exploring <strong>{propertyTitle}</strong>.
            </Text>

            <Section style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>AI Lead Score</Text>
              <Text style={{ ...styles.scoreValue, color: palette.color }}>
                {scoreValue}/10
              </Text>
              <Section style={styles.scoreBar}>
                <Section
                  style={{
                    ...styles.scoreBarFill,
                    width: scorePercentage,
                    backgroundColor: palette.color,
                  }}
                />
              </Section>
            </Section>

            <Section style={styles.detailsCard}>
              <Text style={styles.cardHeading}>Lead Snapshot</Text>

              <Section style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{leadName}</Text>
              </Section>

              <Section style={styles.detailRow}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{leadEmail}</Text>
              </Section>

              {leadPhone && (
                <Section style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{leadPhone}</Text>
                </Section>
              )}

              {budgetRange && (
                <Section style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Budget</Text>
                  <Text style={styles.detailValue}>{budgetRange}</Text>
                </Section>
              )}

              {preferredLocation && (
                <Section style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Preferred Location</Text>
                  <Text style={styles.detailValue}>{preferredLocation}</Text>
                </Section>
              )}
            </Section>

            {engagementSummary && (
              <Section style={styles.engagementCard}>
                <Text style={styles.cardHeading}>Engagement Insights</Text>
                <Text style={styles.engagementText}>{engagementSummary}</Text>
              </Section>
            )}

            <Section style={styles.cta}>
              <Button
                href={leadUrl}
                style={{
                  ...styles.primaryButton,
                  background: palette.color,
                }}
              >
                View Full Lead Profile
              </Button>
            </Section>

            <Section style={styles.tipsCard}>
              <Text style={styles.tipsHeading}>Quick Response Tips</Text>
              {recommendedActions.map((tip, index) => (
                <Text key={index} style={styles.tipItem}>
                  • {tip}
                </Text>
              ))}
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Automated by Tharaga Lead Intelligence ·{' '}
              <a
                href={siteUrl}
                style={styles.footerLink}
                target="_blank"
                rel="noreferrer"
              >
                {siteUrl.replace(/^https?:\/\//, '')}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#030712',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
  },
  container: {
    margin: '0 auto',
    padding: '28px 0 64px',
    maxWidth: '640px',
  },
  badgeWrapper: {
    textAlign: 'center' as const,
    marginBottom: '18px',
  },
  badge: {
    display: 'inline-block',
    padding: '11px 24px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38BDF8',
  },
  content: {
    background: 'rgba(10, 14, 30, 0.92)',
    padding: '44px 38px',
    borderRadius: '22px',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    boxShadow: '0 24px 60px rgba(8, 15, 35, 0.55)',
  },
  greeting: {
    fontSize: '20px',
    color: '#E2E8F0',
    marginBottom: '16px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#CBD5F5',
    marginBottom: '24px',
  },
  scoreCard: {
    textAlign: 'center' as const,
    padding: '32px 0',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '18px',
    marginBottom: '32px',
    border: '1px solid rgba(148, 163, 184, 0.12)',
  },
  scoreLabel: {
    fontSize: '13px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#94A3B8',
    marginBottom: '12px',
  },
  scoreValue: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#38BDF8',
    marginBottom: '18px',
  },
  scoreBar: {
    width: '76%',
    height: '10px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: '9999px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '9999px',
    transition: 'width 0.3s ease',
    backgroundColor: '#38BDF8',
  },
  detailsCard: {
    background: 'rgba(30, 41, 59, 0.55)',
    padding: '26px',
    borderRadius: '18px',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    marginBottom: '24px',
  },
  cardHeading: {
    fontSize: '17px',
    fontWeight: 600,
    color: '#E2E8F0',
    marginBottom: '18px',
  },
  detailRow: {
    marginBottom: '14px',
  },
  detailLabel: {
    fontSize: '13px',
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '6px',
  },
  detailValue: {
    fontSize: '15px',
    fontWeight: 500,
    color: '#F8FAFC',
  },
  engagementCard: {
    padding: '22px',
    background: 'rgba(250, 204, 21, 0.08)',
    borderLeft: '4px solid rgba(250, 204, 21, 0.7)',
    borderRadius: '14px',
    marginBottom: '34px',
  },
  engagementText: {
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#F5E6B3',
  },
  cta: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  primaryButton: {
    color: '#0F172A',
    fontSize: '15px',
    fontWeight: 700,
    textDecoration: 'none',
    display: 'inline-block',
    padding: '15px 34px',
    borderRadius: '9999px',
    background: '#38BDF8',
    boxShadow: '0 16px 35px rgba(56, 189, 248, 0.35)',
  },
  tipsCard: {
    padding: '24px',
    background: 'rgba(15, 118, 110, 0.12)',
    borderRadius: '18px',
    border: '1px solid rgba(45, 212, 191, 0.18)',
  },
  tipsHeading: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#5EEAD4',
    marginBottom: '12px',
  },
  tipItem: {
    fontSize: '14px',
    color: '#CCFBF1',
    marginBottom: '8px',
    lineHeight: '1.7',
  },
  hr: {
    borderColor: 'rgba(148, 163, 184, 0.22)',
    marginTop: '48px',
    marginBottom: '24px',
  },
  footer: {
    textAlign: 'center' as const,
  },
  footerText: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  footerLink: {
    color: '#38BDF8',
    textDecoration: 'none',
  },
}

export default LeadNotificationEmail

