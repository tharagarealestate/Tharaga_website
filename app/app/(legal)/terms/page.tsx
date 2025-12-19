import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout';
import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents';
import { LegalContent } from '@/types/legal';

export const metadata: Metadata = {
  title: 'Terms of Service | Tharaga',
  description: 'Terms of Service for Tharaga - AI-powered zero-commission real estate platform',
  robots: 'index, follow',
};

const defaultTermsContent: LegalContent = {
  title: 'Terms of Service',
  last_updated: new Date().toISOString(),
  sections: [
    {
      id: 'acceptance',
      heading: '1. Acceptance of Terms',
      content: `By accessing or using Tharaga ("Platform", "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all users, including buyers, builders, and visitors to our platform.

Tharaga is an AI-powered zero-commission real estate platform connecting verified builders with home seekers in Chennai, Tamil Nadu. Our goal is to provide a broker-free, transparent real estate marketplace.`,
      order: 1
    },
    {
      id: 'user-accounts',
      heading: '2. User Accounts and Registration',
      content: `Account Creation Requirements:`,
      subsections: [
        {
          id: 'account-creation',
          heading: '2.1 Account Creation',
          content: `- You must provide accurate, complete, and current information
- You must be at least 18 years old to create an account
- You are responsible for maintaining the confidentiality of your account credentials
- You agree to notify us immediately of any unauthorized access
- One person or entity may maintain only one account`,
          order: 1
        },
        {
          id: 'builder-verification',
          heading: '2.2 Builder Verification',
          content: `Builders must provide valid RERA registration numbers, GSTIN, and verification documents. We reserve the right to verify all builder credentials and reject or suspend accounts that fail verification or violate RERA guidelines.

Builders are responsible for maintaining valid RERA registration throughout their use of the platform.`,
          order: 2
        },
        {
          id: 'account-security',
          heading: '2.3 Account Security',
          content: `You are responsible for:
- Maintaining the security of your account
- All activities that occur under your account
- Notifying us immediately of any security breach
- Using strong passwords and enabling multi-factor authentication when available`,
          order: 3
        }
      ],
      order: 2
    },
    {
      id: 'platform-usage',
      heading: '3. Platform Usage',
      content: `Permitted and Prohibited Activities:`,
      subsections: [
        {
          id: 'permitted-use',
          heading: '3.1 Permitted Use',
          content: `You may use our platform to:
- Browse and search for properties in Chennai and Tamil Nadu
- List verified properties (for builders)
- Connect directly with verified builders or qualified buyers
- Access AI-powered property matching and market insights
- Use tools like ROI calculator, EMI calculator, and Vastu checker`,
          order: 1
        },
        {
          id: 'prohibited-activities',
          heading: '3.2 Prohibited Activities',
          content: `You agree NOT to:
- Post false, misleading, or fraudulent property listings
- Impersonate another person or entity
- Violate any applicable laws, including RERA regulations in Tamil Nadu
- Use automated systems to scrape or extract data without permission
- Interfere with or disrupt the Service or servers
- Engage in broker activities (platform is broker-free)
- Upload malicious code, viruses, or harmful content
- Harass, threaten, or abuse other users
- Circumvent security measures or access unauthorized areas
- Use the platform for any illegal purpose`,
          order: 2
        }
      ],
      order: 3
    },
    {
      id: 'property-listings',
      heading: '4. Property Listings',
      content: `Rules and Responsibilities for Property Listings:`,
      subsections: [
        {
          id: 'builder-responsibilities',
          heading: '4.1 Builder Responsibilities',
          content: `Builders must:
- Ensure all property listings are accurate, complete, and up-to-date
- Comply with RERA regulations for Chennai properties
- Obtain necessary approvals and certifications before listing
- Respond to buyer inquiries in a timely manner
- Maintain valid RERA registration throughout listing period
- Provide accurate pricing, location, and property details
- Upload only genuine property images`,
          order: 1
        },
        {
          id: 'content-ownership',
          heading: '4.2 Content Ownership',
          content: `Builders retain ownership of property content but grant Tharaga a license to display, distribute, and promote listings on our platform and partner channels.

Tharaga reserves the right to remove or modify any listing that violates these Terms or applicable laws.`,
          order: 2
        },
        {
          id: 'listing-accuracy',
          heading: '4.3 Listing Accuracy',
          content: `We do not guarantee the accuracy of property listings. Buyers are encouraged to:
- Conduct independent verification of property details
- Visit properties in person before making decisions
- Verify RERA registration independently
- Consult legal and financial advisors`,
          order: 3
        }
      ],
      order: 4
    },
    {
      id: 'pricing-payments',
      heading: '5. Pricing and Payments',
      content: `Our platform operates on a zero-commission model for buyers. Builders may subscribe to premium plans with transparent pricing:`,
      subsections: [
        {
          id: 'pricing-structure',
          heading: '5.1 Pricing Structure',
          content: `- **Buyer Plans**: Free access to property search and matching
- **Builder Plans**: Subscription-based pricing with monthly/annual options
- All prices are in Indian Rupees (INR) and exclusive of GST where applicable
- Subscriptions auto-renew unless cancelled before the billing cycle
- Refunds are governed by our Refund Policy`,
          order: 1
        },
        {
          id: 'payment-processing',
          heading: '5.2 Payment Processing',
          content: `- Payments are processed through Razorpay
- We do not store credit card or payment details
- All transactions are secured with industry-standard encryption
- Failed payments may result in service suspension`,
          order: 2
        },
        {
          id: 'subscription-renewal',
          heading: '5.3 Subscription Renewal',
          content: `- Subscriptions automatically renew at the end of each billing period
- You will be notified 7 days before renewal
- Cancellation must be done before the renewal date to avoid charges
- No refunds for partial billing periods unless specified in Refund Policy`,
          order: 3
        }
      ],
      order: 5
    },
    {
      id: 'disclaimers',
      heading: '6. Disclaimers and Limitations',
      content: `Important Disclaimers:`,
      subsections: [
        {
          id: 'platform-disclaimer',
          heading: '6.1 Platform Disclaimer',
          content: `Tharaga acts as a technology platform connecting buyers and builders. We do not:
- Guarantee the accuracy of property listings
- Verify all property details or conduct site inspections
- Provide legal, financial, or real estate advisory services
- Guarantee successful property transactions
- Act as a broker or intermediary in transactions
- Endorse any specific property or builder`,
          order: 1
        },
        {
          id: 'ai-disclaimer',
          heading: '6.2 AI Predictions Disclaimer',
          content: `Our AI-powered features (ROI predictions, lead scoring, etc.) are provided for informational purposes only:
- AI predictions are not guarantees or financial advice
- Always conduct independent due diligence
- Market conditions can change rapidly
- Past performance does not guarantee future results`,
          order: 2
        },
        {
          id: 'limitation-liability',
          heading: '6.3 Limitation of Liability',
          content: `To the maximum extent permitted by law, Tharaga shall not be liable for:
- Any indirect, incidental, special, consequential, or punitive damages
- Loss of profits, data, or business opportunities
- Property transaction disputes between buyers and builders
- Decisions made based on AI predictions or recommendations
- Service interruptions or technical issues`,
          order: 3
        }
      ],
      order: 6
    },
    {
      id: 'intellectual-property',
      heading: '7. Intellectual Property',
      content: `All content on the Tharaga platform, including logos, designs, text, graphics, software, and AI models, is owned by Tharaga or its licensors. 

You may not:
- Copy, modify, or distribute our content without written permission
- Reverse engineer or attempt to extract source code
- Use our trademarks or branding without authorization
- Create derivative works based on our platform

Property listings and user-generated content remain the property of their respective creators, who grant Tharaga a license to use such content on the platform.`,
      order: 7
    },
    {
      id: 'termination',
      heading: '8. Termination',
      content: `Account Termination:`,
      subsections: [
        {
          id: 'termination-by-us',
          heading: '8.1 Termination by Tharaga',
          content: `We reserve the right to suspend or terminate your account if you:
- Violate these Terms or our policies
- Engage in fraudulent or illegal activities
- Fail to pay subscription fees (for builders)
- Provide false or misleading information
- Violate RERA regulations
- Harass or abuse other users`,
          order: 1
        },
        {
          id: 'termination-by-user',
          heading: '8.2 Termination by User',
          content: `You may terminate your account at any time by:
- Contacting us at tharagarealestate@gmail.com
- Using account deletion features in settings
- Cancelling your subscription (for builders)

Upon termination, your access will be revoked, but some data may be retained as required by law.`,
          order: 2
        },
        {
          id: 'effect-of-termination',
          heading: '8.3 Effect of Termination',
          content: `Upon termination:
- Your right to use the Service immediately ceases
- All outstanding fees remain due
- We may delete or retain your data as required by law
- Active property listings may be removed
- No refunds for unused subscription time unless required by law`,
          order: 3
        }
      ],
      order: 8
    },
    {
      id: 'dispute-resolution',
      heading: '9. Dispute Resolution',
      content: `Dispute Resolution Process:`,
      subsections: [
        {
          id: 'informal-resolution',
          heading: '9.1 Informal Resolution',
          content: `Before initiating formal proceedings, parties agree to attempt informal resolution:
- Contact our support team at tharagarealestate@gmail.com
- Provide detailed description of the dispute
- Allow 30 days for resolution attempts`,
          order: 1
        },
        {
          id: 'governing-law',
          heading: '9.2 Governing Law',
          content: `These Terms are governed by the laws of India and the jurisdiction of Chennai, Tamil Nadu. Any disputes shall be subject to the exclusive jurisdiction of courts in Chennai.`,
          order: 2
        },
        {
          id: 'arbitration',
          heading: '9.3 Arbitration',
          content: `If informal resolution fails, disputes will be resolved through arbitration in Chennai, Tamil Nadu, in accordance with the Arbitration and Conciliation Act, 2015.`,
          order: 3
        }
      ],
      order: 9
    },
    {
      id: 'changes-to-terms',
      heading: '10. Changes to Terms',
      content: `We may modify these Terms at any time. Material changes will be notified via:
- Email to registered users
- Platform notification
- Updated "Last Updated" date

Continued use of the Service after changes constitutes acceptance. If you do not agree to changes, you must stop using the Service and terminate your account.`,
      order: 10
    },
    {
      id: 'contact-information',
      heading: '11. Contact Information',
      content: `For questions about these Terms, contact us:

**Email**: tharagarealestate@gmail.com
**Phone**: +91 88709 80839
**Address**: Chennai, Tamil Nadu, India
**Business Hours**: Monday - Friday, 10 AM - 6 PM IST`,
      order: 11
    }
  ],
  metadata: {
    word_count: 1850,
    reading_time_minutes: 9,
    compliance_standards: ['RERA 2016', 'IT Act 2000', 'Consumer Protection Act 2019']
  }
};

export default async function TermsOfServicePage() {
  const supabase = await createClient();
  
  let termsContent = defaultTermsContent;
  
  try {
    const { data: document, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('document_type', 'terms_of_service')
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (!error && document && document.content) {
      termsContent = document.content as LegalContent;
    }
  } catch (error) {
    console.error('Error fetching terms of service:', error);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <LegalTableOfContents sections={termsContent.sections} />
        </div>

        <div className="lg:col-span-3">
          <LegalDocumentLayout
            title={termsContent.title}
            lastUpdated={termsContent.last_updated}
            documentType="terms_of_service"
            sections={termsContent.sections}
            metadata={termsContent.metadata}
          />
        </div>
      </div>
    </div>
  );
}
