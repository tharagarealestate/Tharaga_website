import type { LegalContent } from '@/types/legal'

/*
 * Tharaga Estates legal documents.
 * Plain text: lines starting with "- " render as bullet points.
 * NOTE: drafted to reflect how Tharaga operates today (free listings, free buyer access,
 * no online payments). Have an advocate review before relying on them.
 */

export const LEGAL_UPDATED = '2026-11-26'
const CONTACT = `Tharaga Estates, Chennai, Tamil Nadu
- Email: tharagarealestate@gmail.com
- Phone / WhatsApp: +91 88709 80839`

export const REFUND_POLICY: LegalContent = {
  title: 'Refund & Fees Policy',
  last_updated: LEGAL_UPDATED,
  sections: [
    {
      id: 'free',
      order: 1,
      heading: '1. Listing your property is free',
      content: `Tharaga Estates does not charge property owners anything to list a property with us. There is no listing fee, no registration fee, no "premium placement" fee and no subscription.
- Submitting your property through the website or WhatsApp is free.
- Desk review, title check guidance and private buyer matching carry no upfront charge.
- You can withdraw your listing at any time, free of charge.`,
    },
    {
      id: 'buyers',
      order: 2,
      heading: '2. Browsing and enquiring is free',
      content: `Buyers and investors can browse the pipeline, shortlist properties, use the Land Check and speak with our desk without paying anything. Signing in with Google is free.`,
    },
    {
      id: 'no-online-payments',
      order: 3,
      heading: '3. We do not take payments on this website',
      content: `No payment is collected through tharaga.in. Because nothing is charged, there is nothing to refund for listing, browsing, enquiries or the Land Check.
- Tharaga Estates will never ask you to pay a fee to list a property, to view a property, or to "unlock" a buyer or seller.
- If anyone asks you for such a payment in our name, do not pay. Report it to us on +91 88709 80839.`,
    },
    {
      id: 'agreed-services',
      order: 4,
      heading: '4. Services agreed in writing',
      content: `If a separate professional service is ever agreed with you (for example, an advisory or transaction mandate on a specific sale or purchase), its fee, timing and any refund terms will be set out in a written agreement signed by both sides before any work begins. That agreement will govern the service; nothing is payable without it.`,
    },
    {
      id: 'transaction-money',
      order: 5,
      heading: '5. Advances and sale money',
      content: `Token advances, sale consideration and similar payments are made between buyer and seller under their own sale agreement, through banking channels. Tharaga Estates does not hold buyer or seller money. Refunds of such amounts are governed by the buyer–seller agreement.`,
    },
    {
      id: 'changes',
      order: 6,
      heading: '6. If this changes',
      content: `If we introduce any paid service in future, we will update this page and clearly show the price before anyone is asked to pay. Free listings already submitted will not be charged retrospectively.`,
    },
    { id: 'contact', order: 7, heading: '7. Contact', content: CONTACT },
  ],
  metadata: { compliance_standards: ['Consumer Protection Act, 2019'] },
}

export const TERMS: LegalContent = {
  title: 'Terms of Use',
  last_updated: LEGAL_UPDATED,
  sections: [
    {
      id: 'about',
      order: 1,
      heading: '1. About these terms',
      content: `These terms apply to your use of tharaga.in, operated by Tharaga Estates, a property advisory based in Chennai, Tamil Nadu. By using the website you agree to them. If you do not agree, please do not use the website.`,
    },
    {
      id: 'what-we-do',
      order: 2,
      heading: '2. What Tharaga Estates does',
      content: `We represent land, solar and energy sites, quarries, commercial and residential property across Tamil Nadu on behalf of their owners, and introduce them privately to buyers.
- Property pages describe each opportunity in general terms. Exact locations, documents and prices are shared only in conversation with buyers we have spoken to.
- Listing a property with us is free (see our Refund & Fees Policy).`,
    },
    {
      id: 'accounts',
      order: 3,
      heading: '3. Your account',
      content: `You can sign in with Google to view full property details, keep a shortlist and track listings you submit.
- Keep your Google account secure; activity under your sign-in is treated as yours.
- One person per account. Do not sign in as someone else.
- You can ask us to delete your account at any time.`,
    },
    {
      id: 'listing',
      order: 4,
      heading: '4. Listing a property with us',
      content: `When you submit a property you confirm that:
- you own it, or are authorised by the owner(s) to offer it;
- the details, photos, videos and documents you send are accurate to the best of your knowledge and are yours to share.
You allow Tharaga Estates to review the material and, once approved by our desk, to use the photos, videos and descriptions to present the property to buyers. We do not publish your phone number, survey numbers or ownership documents. We may decline or withdraw any listing, and you may withdraw yours at any time.`,
    },
    {
      id: 'information',
      order: 5,
      heading: '5. Information on the website',
      content: `We take care with what we publish, but property details (extents, distances, approvals, access, nearby facilities) are indicative and may change.
- Buyers must carry out their own due diligence, including title verification by an advocate and site inspection, before committing.
- The Land Check gives general guidance only. It is not legal, survey, engineering or financial advice.
- Nothing on the website is an offer capable of acceptance; any sale happens only through a written agreement between buyer and seller.`,
    },
    {
      id: 'acceptable-use',
      order: 6,
      heading: '6. Acceptable use',
      content: `Please do not:
- copy, scrape or republish property content, photos or videos without our written permission;
- contact property owners directly by bypassing the desk using information obtained from us;
- submit false, misleading or someone else's property or details;
- interfere with the website's security or normal operation.`,
    },
    {
      id: 'ip',
      order: 7,
      heading: '7. Our content',
      content: `The Tharaga name and logo, website design, text, and the photographs and films we produce belong to Tharaga Estates or are used with permission. Owners keep the rights in the material they send us.`,
    },
    {
      id: 'liability',
      order: 8,
      heading: '8. Liability',
      content: `To the extent permitted by law, Tharaga Estates is not liable for indirect or consequential loss arising from use of the website or reliance on its general information. Nothing in these terms limits rights you have under Indian consumer law.`,
    },
    {
      id: 'law',
      order: 9,
      heading: '9. Governing law',
      content: `These terms are governed by the laws of India. Courts in Chennai, Tamil Nadu have jurisdiction. We will always try to resolve concerns informally first — write to us and we will respond within 7 working days.`,
    },
    {
      id: 'changes',
      order: 10,
      heading: '10. Changes',
      content: `We may update these terms as the service develops. The date at the top shows the latest version.`,
    },
    { id: 'contact', order: 11, heading: '11. Contact', content: CONTACT },
  ],
  metadata: { compliance_standards: ['Information Technology Act, 2000', 'Consumer Protection Act, 2019'] },
}

export const PRIVACY: LegalContent = {
  title: 'Privacy Policy',
  last_updated: LEGAL_UPDATED,
  sections: [
    {
      id: 'intro',
      order: 1,
      heading: '1. Who we are',
      content: `Tharaga Estates ("we") operates tharaga.in from Chennai, Tamil Nadu. This policy explains what personal data we collect, why, and the choices you have, in line with the Digital Personal Data Protection Act, 2023.`,
    },
    {
      id: 'collect',
      order: 2,
      heading: '2. What we collect',
      content: `- Sign-in details from Google: your name, email address and profile photo.
- Enquiries: your name, phone number, email and message when you contact us about a property.
- Property listings: owner name, phone, email, property location and description, and the photos, videos or documents you upload.
- Your shortlist and Land Check answers, so we can show relevant properties.
- Basic technical data (device, browser, pages visited) needed to run and secure the website.
We do not collect payment card or bank details on this website.`,
    },
    {
      id: 'use',
      order: 3,
      heading: '3. How we use it',
      content: `- To show you full property details, your shortlist and the status of your listings.
- To respond to enquiries and arrange calls or site visits.
- To review, verify and present properties you list to suitable buyers.
- To keep the website secure and prevent misuse.
We do not sell your personal data, and we do not use it for unrelated advertising.`,
    },
    {
      id: 'sharing',
      order: 4,
      heading: '4. Who we share it with',
      content: `- Service providers who run the website for us: hosting and database (Netlify, Supabase), Google sign-in, email delivery, and an AI service that helps our desk summarise listing descriptions. They process data only on our instructions.
- Buyers or owners, only to the extent needed to progress a property you have engaged with us on, and never your number without your agreement.
- Authorities, where the law requires it.`,
    },
    {
      id: 'retention',
      order: 5,
      heading: '5. How long we keep it',
      content: `We keep account and listing data while your account or listing is active, and for a reasonable period afterwards for records and legal obligations. Uploaded property media for a withdrawn listing is deleted on request.`,
    },
    {
      id: 'rights',
      order: 6,
      heading: '6. Your rights',
      content: `You can ask us to:
- show you the personal data we hold about you;
- correct or update it;
- delete it, or withdraw consent for its use;
- nominate someone to exercise these rights for you.
Write to tharagarealestate@gmail.com and we will respond within 30 days.`,
    },
    {
      id: 'cookies',
      order: 7,
      heading: '7. Cookies and storage',
      content: `We use essential browser storage to keep you signed in and remember your shortlist. You can clear it at any time from your browser settings; you will be signed out.`,
    },
    {
      id: 'security',
      order: 8,
      heading: '8. Security',
      content: `Data is encrypted in transit. Listing photos and documents are stored privately and are visible only to our desk. Access is limited to people who need it.`,
    },
    {
      id: 'children',
      order: 9,
      heading: '9. Children',
      content: `The website is intended for adults. We do not knowingly collect data from anyone under 18.`,
    },
    {
      id: 'changes',
      order: 10,
      heading: '10. Changes',
      content: `We will update this page if our practices change. The date at the top shows the latest version.`,
    },
    {
      id: 'grievance',
      order: 11,
      heading: '11. Grievance officer',
      content: `For any privacy concern or request, contact our Grievance Officer: Nithish R, Founder, ${CONTACT}`,
    },
  ],
  metadata: { compliance_standards: ['Digital Personal Data Protection Act, 2023', 'Information Technology Act, 2000'] },
}
