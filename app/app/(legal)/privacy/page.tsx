import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout';
import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents';
import { ConsentManager } from '@/components/legal/ConsentManager';
import { LegalContent } from '@/types/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy | Tharaga - DPDP Act 2023 Compliant',
  description: 'Tharaga privacy policy compliant with India\'s Digital Personal Data Protection Act 2023. Learn how we protect your data.',
  robots: 'index, follow',
};

// Fallback privacy content
const defaultPrivacyContent: LegalContent = {
  title: 'Privacy Policy',
  last_updated: new Date().toISOString(),
  sections: [
    {
      id: 'introduction',
      heading: '1. Introduction',
      content: `Welcome to Tharaga ("we," "our," or "us"). We are committed to protecting your personal data and respecting your privacy rights. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered real estate platform.

This policy complies with:
- India's Digital Personal Data Protection Act, 2023 (DPDP Act)
- Real Estate (Regulation and Development) Act, 2016 (RERA)
- Information Technology Act, 2000
- General Data Protection Regulation (GDPR) for international users`,
      order: 1
    },
    {
      id: 'data-controller',
      heading: '2. Data Controller Information',
      content: `Tharaga
Email: tharagarealestate@gmail.com
Phone: +91 88709 80839
Address: Chennai, Tamil Nadu, India

For data protection queries, contact: privacy@tharaga.com`,
      order: 2
    },
    {
      id: 'data-collection',
      heading: '3. What Data We Collect',
      content: `We collect the following categories of data:`,
      subsections: [
        {
          id: 'account-data',
          heading: '3.1 Account Information',
          content: `- Full name
- Email address
- Phone number
- Password (encrypted)
- User role (Buyer/Builder)
- Profile photo (optional)`,
          order: 1
        },
        {
          id: 'property-data',
          heading: '3.2 Property Preferences & Search Data',
          content: `- Search queries and filters
- Saved properties and favorites
- Property viewing history
- Budget range and location preferences
- Property comparison data`,
          order: 2
        },
        {
          id: 'builder-data',
          heading: '3.3 Builder Business Information',
          content: `- Company name and registration details
- RERA registration number
- GST number
- Business address
- Banking details (for subscriptions)
- Property listings and documents`,
          order: 3
        },
        {
          id: 'behavioral-data',
          heading: '3.4 Behavioral & Analytics Data',
          content: `- Pages visited and time spent
- Device information (browser, OS, screen size)
- IP address and location (city-level)
- Referral source
- Click patterns and interactions
- AI feature usage patterns`,
          order: 4
        },
        {
          id: 'communication-data',
          heading: '3.5 Communication Data',
          content: `- Messages between buyers and builders
- Email correspondence
- SMS/WhatsApp communications (if opted in)
- Customer support tickets
- Phone call recordings (with consent)`,
          order: 5
        },
        {
          id: 'financial-data',
          heading: '3.6 Financial Information',
          content: `- Payment transaction IDs (via Razorpay)
- Subscription status and history
- Billing address
- GST information
Note: We DO NOT store credit card numbers or CVV`,
          order: 6
        },
        {
          id: 'ai-generated-data',
          heading: '3.7 AI-Generated Insights',
          content: `- Lead quality scores
- Property appreciation predictions
- Risk assessments
- Personalized recommendations
- Voice search transcripts (Tamil/English)`,
          order: 7
        }
      ],
      order: 3
    },
    {
      id: 'data-usage',
      heading: '4. How We Use Your Data',
      content: `We use your data for the following purposes:`,
      subsections: [
        {
          id: 'primary-services',
          heading: '4.1 Primary Services',
          content: `- Matching buyers with suitable properties
- Connecting builders with qualified leads
- Generating AI-powered property insights
- Processing payments and subscriptions
- Verifying RERA compliance
- Preventing fraud and ensuring security`,
          order: 1
        },
        {
          id: 'ai-ml-purposes',
          heading: '4.2 AI/ML Model Training',
          content: `We use aggregated, anonymized data to:
- Improve property price predictions
- Enhance lead scoring algorithms
- Refine search relevance
- Train voice recognition models (Tamil)
- Optimize recommendation engines

Your data is anonymized before being used for training. You can opt-out of AI training in account settings.`,
          order: 2
        },
        {
          id: 'communications',
          heading: '4.3 Communications',
          content: `- Transactional emails (account confirmations, password resets)
- New property alerts matching your preferences
- Builder subscription renewal reminders
- Platform updates and new features
- Marketing communications (opt-in only)`,
          order: 3
        },
        {
          id: 'legal-compliance',
          heading: '4.4 Legal & Compliance',
          content: `- Responding to legal requests
- Enforcing our Terms of Service
- Preventing illegal activities
- Complying with RERA regulations
- Tax reporting (GST)`,
          order: 4
        }
      ],
      order: 4
    },
    {
      id: 'legal-basis',
      heading: '5. Legal Basis for Processing (DPDP Act 2023)',
      content: `Under the DPDP Act 2023, we process your data based on:

- **Consent**: You explicitly agree to data processing when creating an account
- **Contractual Necessity**: Required to provide our services
- **Legal Obligation**: RERA compliance, tax regulations, anti-fraud measures
- **Legitimate Interests**: Platform security, service improvement, fraud prevention

You have the right to withdraw consent at any time through account settings.`,
      order: 5
    },
    {
      id: 'data-sharing',
      heading: '6. Who We Share Your Data With',
      content: `We share data with the following third parties:`,
      subsections: [
        {
          id: 'service-providers',
          heading: '6.1 Service Providers',
          content: `- **Supabase**: Database and authentication (US-based, GDPR compliant)
- **Razorpay**: Payment processing (India-based)
- **Twilio**: SMS/WhatsApp notifications (US-based)
- **Resend**: Email delivery (US-based)
- **Google Cloud**: AI model hosting (Singapore region)
- **Netlify**: Website hosting (US-based)

All providers are GDPR-compliant with data processing agreements.`,
          order: 1
        },
        {
          id: 'builders-buyers',
          heading: '6.2 Between Buyers & Builders',
          content: `When you express interest in a property:
- Builders receive your name, phone, email, and budget range
- Buyers receive builder's company name and contact details

We never share financial data, passwords, or full search history.`,
          order: 2
        },
        {
          id: 'legal-authorities',
          heading: '6.3 Legal Authorities',
          content: `We may disclose data when legally required:
- Court orders or subpoenas
- Law enforcement requests
- RERA compliance audits
- Tax authorities (GST records)`,
          order: 3
        },
        {
          id: 'business-transfers',
          heading: '6.4 Business Transfers',
          content: `If Tharaga is acquired or merged, your data may be transferred to the new owner. You will be notified 30 days in advance.`,
          order: 4
        }
      ],
      order: 6
    },
    {
      id: 'data-retention',
      heading: '7. Data Retention',
      content: `We retain your data as follows:

- **Active accounts**: Data retained while account is active
- **Closed accounts**: Personal data deleted within 30 days (unless legal obligation)
- **Transaction records**: 7 years (tax/audit requirements)
- **Analytics data**: Anonymized after 2 years
- **AI training data**: Anonymized permanently (cannot be deleted)
- **RERA documents**: 5 years (regulatory requirement)

You can request immediate deletion via: privacy@tharaga.com`,
      order: 7
    },
    {
      id: 'your-rights',
      heading: '8. Your Data Rights (DPDP Act 2023)',
      content: `Under India's DPDP Act 2023, you have the following rights:`,
      subsections: [
        {
          id: 'right-to-access',
          heading: '8.1 Right to Access',
          content: `Request a copy of all your personal data in machine-readable format (JSON/CSV).`,
          order: 1
        },
        {
          id: 'right-to-correction',
          heading: '8.2 Right to Correction',
          content: `Request correction of inaccurate or incomplete data.`,
          order: 2
        },
        {
          id: 'right-to-erasure',
          heading: '8.3 Right to Erasure',
          content: `Request deletion of your data (subject to legal retention requirements).`,
          order: 3
        },
        {
          id: 'right-to-data-portability',
          heading: '8.4 Right to Data Portability',
          content: `Export your data to use with another service.`,
          order: 4
        },
        {
          id: 'right-to-nominate',
          heading: '8.5 Right to Nominate',
          content: `Nominate another person to exercise your rights in case of death or incapacity.`,
          order: 5
        },
        {
          id: 'right-to-grievance',
          heading: '8.6 Right to Grievance Redressal',
          content: `File complaints with our Data Protection Officer or the Data Protection Board of India.`,
          order: 6
        }
      ],
      order: 8
    },
    {
      id: 'cookies',
      heading: '9. Cookies & Tracking Technologies',
      content: `We use the following types of cookies:`,
      subsections: [
        {
          id: 'essential-cookies',
          heading: '9.1 Essential Cookies (Cannot be disabled)',
          content: `- Authentication and session management
- Security and fraud prevention
- Load balancing
- GDPR consent management`,
          order: 1
        },
        {
          id: 'analytics-cookies',
          heading: '9.2 Analytics Cookies (Optional)',
          content: `- Google Analytics 4 (anonymized IP)
- Hotjar heatmaps (session recordings)
- Page performance metrics`,
          order: 2
        },
        {
          id: 'marketing-cookies',
          heading: '9.3 Marketing Cookies (Optional)',
          content: `- Facebook Pixel (if you opt-in)
- Google Ads conversion tracking
- LinkedIn Insight Tag`,
          order: 3
        }
      ],
      order: 9
    },
    {
      id: 'ai-transparency',
      heading: '10. AI Transparency & Limitations',
      content: `Our AI models have the following characteristics:

**ROI Prediction Engine**:
- 85% accuracy based on backtesting (2020-2024 data)
- Uses 50+ variables (location, amenities, market trends)
- Updated monthly with new market data
- Limitations: Cannot predict black swan events, government policy changes

**Lead Scoring Algorithm**:
- Scores leads 0-100 based on engagement, budget match, timeline
- Not based on protected characteristics (religion, caste, gender)
- Regularly audited for bias

**Tamil Voice Search**:
- Uses Google Cloud Speech-to-Text API
- 92% accuracy for Tamil
- May struggle with heavy accents or background noise

**IMPORTANT**: AI predictions are not guarantees. Always conduct independent due diligence before property purchases.`,
      order: 10
    },
    {
      id: 'international-transfers',
      heading: '11. International Data Transfers',
      content: `Some of our service providers are located outside India:

- **United States**: Supabase, Twilio, Netlify (GDPR-compliant with Standard Contractual Clauses)
- **Singapore**: Google Cloud AI (adequate data protection recognized by India)

We ensure all international transfers comply with DPDP Act 2023 requirements.`,
      order: 11
    },
    {
      id: 'children-privacy',
      heading: "12. Children's Privacy",
      content: `Tharaga is not intended for users under 18 years old. We do not knowingly collect data from minors. If you believe a minor has provided us data, contact: privacy@tharaga.com`,
      order: 12
    },
    {
      id: 'data-security',
      heading: '13. Data Security Measures',
      content: `We implement industry-standard security:

- End-to-end encryption for sensitive data
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- Multi-factor authentication (MFA) available
- Regular security audits and penetration testing
- SOC 2 Type II compliant infrastructure (Supabase)
- Daily encrypted backups
- Role-based access controls (RBAC)
- Incident response plan with 24-hour notification

Despite our efforts, no system is 100% secure. Use strong passwords and enable MFA.`,
      order: 13
    },
    {
      id: 'breach-notification',
      heading: '14. Data Breach Notification',
      content: `In case of a data breach affecting your rights:

1. We will notify you within 72 hours
2. Email notification to registered address
3. Details of compromised data
4. Steps taken to mitigate harm
5. Recommendations for protecting your account
6. Free credit monitoring (if financial data exposed)

Breaches will be reported to the Data Protection Board of India as required.`,
      order: 14
    },
    {
      id: 'policy-changes',
      heading: '15. Changes to This Policy',
      content: `We may update this Privacy Policy to reflect:
- Legal or regulatory changes
- New features or services
- Changes in data processing practices

**Notification Process**:
- 30 days advance notice via email
- Prominent banner on website
- Version history maintained
- Continued use implies acceptance

Major changes require re-consent.`,
      order: 15
    },
    {
      id: 'contact-dpo',
      heading: '16. Contact Our Data Protection Officer',
      content: `For privacy concerns, data requests, or complaints:

**Data Protection Officer**
Email: privacy@tharaga.com / tharagarealestate@gmail.com
Phone: +91 88709 80839
Address: Tharaga, Chennai, Tamil Nadu, India

**Response Time**: Within 7 business days for general queries, 30 days for complex data requests.

**Escalation**: If unsatisfied with our response, you can file a complaint with:
**Data Protection Board of India**
Website: [Will be updated once DPB is operational]`,
      order: 16
    },
    {
      id: 'effective-date',
      heading: '17. Effective Date',
      content: `This Privacy Policy is effective as of December 20, 2024.
Last Updated: December 20, 2024
Version: 1.0`,
      order: 17
    }
  ],
  metadata: {
    word_count: 2450,
    reading_time_minutes: 12,
    compliance_standards: ['DPDP Act 2023', 'RERA 2016', 'GDPR', 'IT Act 2000']
  }
};

export default async function PrivacyPolicyPage() {
  const supabase = await createClient();
  
  // Fetch active privacy policy from database
  let privacyContent = defaultPrivacyContent;
  
  try {
    const { data: document, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('document_type', 'privacy_policy')
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (!error && document && document.content) {
      privacyContent = document.content as LegalContent;
    }
  } catch (error) {
    console.error('Error fetching privacy policy:', error);
    // Use default content on error
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Table of Contents - Sticky Sidebar */}
        <div className="lg:col-span-1">
          <LegalTableOfContents sections={privacyContent.sections} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <LegalDocumentLayout
            title={privacyContent.title}
            lastUpdated={privacyContent.last_updated}
            documentType="privacy_policy"
            sections={privacyContent.sections}
            metadata={privacyContent.metadata}
          />

          {/* Consent Manager at bottom */}
          <div className="mt-12">
            <ConsentManager />
          </div>
        </div>
      </div>
    </div>
  );
}


