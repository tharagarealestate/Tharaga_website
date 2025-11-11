import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Section,
  Text,
} from '@react-email/components'

export interface WelcomeEmailProps {
  name?: string
  propertyTitle?: string
  propertyImage?: string
  propertyPrice?: string
  propertyLocation?: string
  viewPropertyUrl?: string
  builderName?: string
  builderPhone?: string
  builderEmail?: string
  unsubscribeUrl?: string
  siteUrl?: string
}

const baseSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tharaga.co.in'

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name = 'there',
  propertyTitle,
  propertyImage,
  propertyPrice,
  propertyLocation,
  viewPropertyUrl,
  builderName = 'Tharaga Team',
  builderPhone,
  builderEmail,
  unsubscribeUrl = `${baseSiteUrl}/unsubscribe`,
  siteUrl = baseSiteUrl,
}) => {
  const sanitizedPrice = propertyPrice
    ? propertyPrice.trim().startsWith('₹')
      ? propertyPrice.trim()
      : `₹${propertyPrice.trim()}`
    : undefined

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img
              src={`${siteUrl.replace(/\/$/, '')}/logo.png`}
              alt="Tharaga"
              width="150"
              height="40"
              style={styles.logo}
            />
          </Section>

          <Section style={styles.content}>
            <Text style={styles.heading}>Welcome to Tharaga! 👋</Text>

            <Text style={styles.paragraph}>Hi {name},</Text>

            <Text style={styles.paragraph}>
              Thank you for your interest in {propertyTitle ?? 'our properties'}!
              We&apos;re excited to help you find your dream home.
            </Text>

            {propertyTitle && (
              <Section style={styles.propertyCard}>
                {propertyImage && (
                  <Img
                    src={propertyImage}
                    alt={propertyTitle}
                    width="560"
                    height="300"
                    style={styles.propertyImage}
                  />
                )}

                <Section style={styles.propertyDetails}>
                  <Text style={styles.propertyTitle}>{propertyTitle}</Text>

                  {propertyLocation && (
                    <Text style={styles.propertyLocation}>📍 {propertyLocation}</Text>
                  )}

                  {sanitizedPrice && (
                    <Text style={styles.propertyPrice}>{sanitizedPrice}</Text>
                  )}

                  {viewPropertyUrl && (
                    <Button href={viewPropertyUrl} style={styles.button}>
                      View Property Details
                    </Button>
                  )}
                </Section>
              </Section>
            )}

            <Section style={styles.nextSteps}>
              <Text style={styles.subheading}>What&apos;s next?</Text>

              <Text style={styles.listItem}>✅ Browse our verified property listings</Text>
              <Text style={styles.listItem}>✅ Schedule a site visit at your convenience</Text>
              <Text style={styles.listItem}>✅ Get personalized recommendations based on your preferences</Text>
              <Text style={styles.listItem}>✅ Direct connection with builders - zero broker fees</Text>
            </Section>

            <Section style={styles.cta}>
              <Button href={`${siteUrl.replace(/\/$/, '')}/properties`} style={styles.primaryButton}>
                Explore Properties
              </Button>
            </Section>

            <Section style={styles.contact}>
              <Text style={styles.contactHeading}>Need Help?</Text>
              <Text style={styles.paragraph}>
                Our team is here to assist you. Feel free to reach out to {builderName}.
              </Text>

              {builderPhone && <Text style={styles.contactItem}>📞 {builderPhone}</Text>}
              {builderEmail && <Text style={styles.contactItem}>✉️ {builderEmail}</Text>}
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>© {new Date().getFullYear()} Tharaga Real Estate. All rights reserved.</Text>

            <Text style={styles.footerText}>
              <Link href={`${siteUrl.replace(/\/$/, '')}/privacy`} style={styles.footerLink}>
                Privacy Policy
              </Link>
              {' · '}
              <Link href={`${siteUrl.replace(/\/$/, '')}/terms`} style={styles.footerLink}>
                Terms of Service
              </Link>
              {' · '}
              <Link href={unsubscribeUrl} style={styles.footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    backgroundColor: '#04070F',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
  },
  container: {
    margin: '0 auto',
    padding: '24px 0 56px',
    maxWidth: '640px',
  },
  header: {
    padding: '36px 24px',
    textAlign: 'center' as const,
    background:
      'linear-gradient(135deg, rgba(30, 58, 95, 0.95), rgba(15, 118, 110, 0.85))',
    borderRadius: '18px',
    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.4)',
  },
  logo: {
    margin: '0 auto',
    display: 'block',
  },
  content: {
    background: 'rgba(10, 17, 36, 0.85)',
    padding: '44px 36px',
    borderRadius: '20px',
    marginTop: '-32px',
    boxShadow: '0 30px 60px rgba(8, 15, 35, 0.45)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
  },
  heading: {
    fontSize: '30px',
    fontWeight: 700,
    color: '#F1F5F9',
    marginBottom: '18px',
    lineHeight: '1.3',
  },
  subheading: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#E2E8F0',
    marginTop: '32px',
    marginBottom: '18px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#CBD5F5',
    marginBottom: '16px',
  },
  propertyCard: {
    background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(30, 64, 175, 0.35))',
    borderRadius: '18px',
    overflow: 'hidden',
    marginTop: '32px',
    marginBottom: '36px',
    border: '1px solid rgba(148, 163, 184, 0.25)',
  },
  propertyImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  propertyDetails: {
    padding: '24px',
  },
  propertyTitle: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#F8FAFC',
    marginBottom: '10px',
  },
  propertyLocation: {
    fontSize: '14px',
    color: '#C4D4F4',
    marginBottom: '12px',
  },
  propertyPrice: {
    fontSize: '26px',
    fontWeight: 700,
    color: '#FACC15',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#FACC15',
    color: '#0F172A',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '13px 28px',
    borderRadius: '9999px',
    marginTop: '12px',
  },
  primaryButton: {
    background:
      'linear-gradient(135deg, rgba(20, 184, 166, 1), rgba(14, 165, 233, 1))',
    color: '#0F172A',
    fontSize: '16px',
    fontWeight: 700,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '16px 36px',
    borderRadius: '9999px',
    marginTop: '12px',
    boxShadow: '0 15px 30px rgba(14, 165, 233, 0.25)',
  },
  nextSteps: {
    marginTop: '36px',
  },
  listItem: {
    fontSize: '15px',
    lineHeight: '1.8',
    color: '#E2E8F0',
    marginBottom: '10px',
  },
  cta: {
    textAlign: 'center' as const,
    marginTop: '44px',
    marginBottom: '36px',
  },
  contact: {
    marginTop: '40px',
    padding: '24px',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
  },
  contactHeading: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#E2E8F0',
    marginBottom: '12px',
  },
  contactItem: {
    fontSize: '15px',
    color: '#CBD5F5',
    marginBottom: '8px',
  },
  hr: {
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginTop: '48px',
    marginBottom: '32px',
  },
  footer: {
    textAlign: 'center' as const,
    padding: '0 24px',
  },
  footerText: {
    fontSize: '13px',
    color: '#94A3B8',
    marginBottom: '8px',
  },
  footerLink: {
    color: '#38BDF8',
    textDecoration: 'none',
  },
}

export default WelcomeEmail

