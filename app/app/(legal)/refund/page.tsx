import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout';
import { LegalTableOfContents } from '@/components/legal/LegalTableOfContents';
import { LegalContent } from '@/types/legal';

export const metadata: Metadata = {
  title: 'Refund Policy | Tharaga',
  description: 'Refund and cancellation policy for Tharaga subscription plans',
  robots: 'index, follow',
};

const defaultRefundContent: LegalContent = {
  title: 'Refund Policy',
  last_updated: new Date().toISOString(),
  sections: [
    {
      id: 'overview',
      heading: '1. Overview',
      content: `Tharaga offers subscription-based SaaS plans for builders and free access for buyers. This Refund Policy outlines our terms for refunds, cancellations, and billing disputes. As a Chennai-based real estate platform, we follow Indian consumer protection laws and maintain transparency in all transactions.`,
      order: 1
    },
    {
      id: 'subscription-plans',
      heading: '2. Subscription Plans & Billing Cycles',
      content: `Subscription Details:`,
      subsections: [
        {
          id: 'builder-plans',
          heading: '2.1 Builder Plans',
          content: `- **Builder Starter**: ₹999/month or ₹9,990/year
- **Builder Professional**: ₹2,999/month or ₹29,990/year
- **Builder Enterprise**: ₹14,999/month or ₹1,49,990/year

All builder subscriptions are billed in advance on a monthly or annual basis. Subscriptions auto-renew unless cancelled before the billing cycle ends.`,
          order: 1
        },
        {
          id: 'buyer-plans',
          heading: '2.2 Buyer Plans',
          content: `Buyer plans are free. Premium buyer features may be available in the future with separate pricing.`,
          order: 2
        },
        {
          id: 'billing-cycle',
          heading: '2.3 Billing Cycle',
          content: `- Monthly subscriptions renew on the same date each month
- Annual subscriptions renew on the anniversary date
- You will receive email notifications 7 days before renewal
- All prices are in INR and exclusive of GST (18%)`,
          order: 3
        }
      ],
      order: 2
    },
    {
      id: 'refund-eligibility',
      heading: '3. Refund Eligibility',
      content: `Refund Conditions:`,
      subsections: [
        {
          id: 'money-back-guarantee',
          heading: '3.1 7-Day Money-Back Guarantee',
          content: `New subscribers are eligible for a full refund within 7 days of their initial subscription purchase, provided:
- No more than 3 property listings have been created
- No more than 10 leads have been accessed
- No chargebacks or disputes have been initiated
- Request is made through our official support channel
- Account has not violated our Terms of Service`,
          order: 1
        },
        {
          id: 'pro-rated-refunds',
          heading: '3.2 Pro-Rated Refunds (After 7 Days)',
          content: `After the 7-day guarantee period, refunds are calculated on a pro-rated basis for unused subscription time:

**Monthly Subscriptions**: Refund = (Days Remaining / Total Days) × Monthly Price
**Annual Subscriptions**: Refund = (Months Remaining / 12) × Annual Price

- Minimum refund amount: ₹500 or the remaining balance, whichever is lower
- Processing fee of ₹200 may apply for annual subscriptions
- Refunds processed within 7-10 business days`,
          order: 2
        },
        {
          id: 'special-circumstances',
          heading: '3.3 Special Circumstances',
          content: `Full or partial refunds may be granted in special cases:
- Service outages exceeding 48 hours in a billing cycle
- Billing errors on our part
- Duplicate charges
- Unauthorized transactions (subject to verification)`,
          order: 3
        }
      ],
      order: 3
    },
    {
      id: 'non-refundable',
      heading: '4. Non-Refundable Items',
      content: `The following are NOT eligible for refunds:
- Used or consumed services (e.g., leads accessed, listings published)
- Add-on services purchased separately (e.g., featured listings, premium placements)
- Subscription renewals beyond the initial 7-day guarantee
- Accounts suspended or terminated due to policy violations
- Processing fees and taxes (GST) already remitted to authorities
- Refund requests made more than 30 days after cancellation
- Services used during the billing period`,
      order: 4
    },
    {
      id: 'cancellation',
      heading: '5. Cancellation Policy',
      content: `How to Cancel:`,
      subsections: [
        {
          id: 'how-to-cancel',
          heading: '5.1 How to Cancel',
          content: `Subscriptions can be cancelled at any time:
- Through your Builder Dashboard → Settings → Billing
- By emailing tharagarealestate@gmail.com
- By calling our support team at +91 88709 80839

Cancellation requests must include your account email and subscription plan details.`,
          order: 1
        },
        {
          id: 'cancellation-effective',
          heading: '5.2 Cancellation Effective Date',
          content: `- Cancellation takes effect at the end of the current billing period
- You retain access to all features until the subscription expires
- No new charges will be made after cancellation
- Auto-renewal is disabled immediately upon cancellation
- You can reactivate your subscription anytime before expiry`,
          order: 2
        },
        {
          id: 'immediate-cancellation',
          heading: '5.3 Immediate Cancellation',
          content: `If you request immediate cancellation (before period end):
- Access will be revoked immediately
- Pro-rated refund may be available (subject to eligibility)
- No refund for the current billing period if more than 7 days have passed`,
          order: 3
        }
      ],
      order: 5
    },
    {
      id: 'refund-process',
      heading: '6. Refund Process',
      content: `Refund Request and Processing:`,
      subsections: [
        {
          id: 'request-submission',
          heading: '6.1 Request Submission',
          content: `To request a refund:
1. Submit refund request via email to tharagarealestate@gmail.com or through support
2. Include your account email, subscription plan, and reason for refund
3. Our team will review within 2 business days
4. Approved refunds are processed within 7-10 business days`,
          order: 1
        },
        {
          id: 'refund-methods',
          heading: '6.2 Refund Methods',
          content: `Refunds are credited to the original payment method:
- Credit card/debit card refunds: 7-10 business days
- Bank transfer refunds: 5-7 business days
- Digital wallet refunds (Paytm, PhonePe): 3-5 business days
- UPI refunds: 3-5 business days

Refund processing times may vary based on your bank or payment provider.`,
          order: 2
        },
        {
          id: 'refund-confirmation',
          heading: '6.3 Refund Confirmation',
          content: `You will receive:
- Email confirmation when refund is approved
- Email notification when refund is processed
- Refund receipt for your records
- Updated invoice reflecting the refund`,
          order: 3
        }
      ],
      order: 6
    },
    {
      id: 'special-circumstances',
      heading: '7. Special Circumstances',
      content: `Special Refund Scenarios:`,
      subsections: [
        {
          id: 'service-interruptions',
          heading: '7.1 Service Interruptions',
          content: `If our platform experiences significant downtime (more than 48 hours in a billing cycle), we will issue service credits or pro-rated refunds at our discretion.`,
          order: 1
        },
        {
          id: 'billing-errors',
          heading: '7.2 Billing Errors',
          content: `If you notice billing errors, contact us within 30 days. We will investigate and issue corrections or refunds as appropriate.`,
          order: 2
        },
        {
          id: 'plan-downgrades',
          heading: '7.3 Plan Downgrades',
          content: `When downgrading to a lower plan:
- A pro-rated credit will be applied to your account for the difference
- Refunds are not issued for downgrades unless you cancel within the 7-day guarantee period
- Downgrade takes effect at the end of current billing period`,
          order: 3
        }
      ],
      order: 7
    },
    {
      id: 'chargebacks',
      heading: '8. Chargebacks and Disputes',
      content: `Initiating a chargeback or payment dispute may result in:
- Immediate account suspension
- Permanent ban from the platform
- Legal action to recover costs and fees
- Loss of eligibility for future refunds

We encourage direct communication to resolve issues before initiating disputes. Contact us at tharagarealestate@gmail.com for assistance.`,
      order: 8
    },
    {
      id: 'gst-taxes',
      heading: '9. GST and Taxes',
      content: `- All prices are in Indian Rupees (INR) and exclusive of GST (18%)
- Refund amounts will include GST for eligible refunds
- Tax receipts are provided for all transactions
- GST cannot be refunded separately if already remitted to authorities
- Refunded amounts are subject to applicable tax laws`,
      order: 9
    },
    {
      id: 'contact',
      heading: '10. Contact for Refunds',
      content: `For refund requests or billing inquiries:

**Email**: tharagarealestate@gmail.com
**Phone**: +91 88709 80839 (Mon-Fri, 10 AM - 6 PM IST)
**Address**: Chennai, Tamil Nadu, India
**Response Time**: 2 business days for initial response, 7-10 business days for refund processing`,
      order: 10
    },
    {
      id: 'policy-changes',
      heading: '11. Changes to This Policy',
      content: `We reserve the right to modify this Refund Policy. Changes will be notified via:
- Email to registered users
- Platform notification
- Updated "Last Updated" date

Changes are effective immediately upon notification. Continued use of our service after changes constitutes acceptance.`,
      order: 11
    }
  ],
  metadata: {
    word_count: 1200,
    reading_time_minutes: 6,
    compliance_standards: ['Consumer Protection Act 2019', 'IT Act 2000']
  }
};

export default async function RefundPolicyPage() {
  const supabase = await createClient();
  
  let refundContent = defaultRefundContent;
  
  try {
    const { data: document, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('document_type', 'refund_policy')
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (!error && document && document.content) {
      refundContent = document.content as LegalContent;
    }
  } catch (error) {
    console.error('Error fetching refund policy:', error);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <LegalTableOfContents sections={refundContent.sections} />
        </div>

        <div className="lg:col-span-3">
          <LegalDocumentLayout
            title={refundContent.title}
            lastUpdated={refundContent.last_updated}
            documentType="refund_policy"
            sections={refundContent.sections}
            metadata={refundContent.metadata}
          />
        </div>
      </div>
    </div>
  );
}








