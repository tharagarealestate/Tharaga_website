'use client'

import React from 'react'
import Link from 'next/link'
import { RefreshCw, Clock, CheckCircle, XCircle, CreditCard, Info } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Refund Policy' }
        ]} />

        <div className="max-w-4xl mx-auto mt-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6">
              <RefreshCw className="w-4 h-4 text-gold-300" />
              <span className="text-gold-300 text-sm font-medium">Refund & Cancellation</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Refund Policy
            </h1>
            <p className="text-xl text-gray-300">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 space-y-8 text-white/90">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Overview</h2>
              <p className="leading-relaxed">
                Tharaga offers subscription-based SaaS plans for builders and free access for buyers. This Refund Policy outlines our terms for refunds, cancellations, and billing disputes. As a Chennai-based real estate platform, we follow Indian consumer protection laws and maintain transparency in all transactions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-6 h-6 text-gold-500" />
                2. Subscription Plans & Billing Cycles
              </h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Builder Plans</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Builder Starter:</strong> ₹999/month or ₹9,990/year</li>
                <li><strong>Builder Professional:</strong> ₹2,999/month or ₹29,990/year</li>
                <li><strong>Builder Enterprise:</strong> ₹14,999/month or ₹1,49,990/year</li>
              </ul>
              <p className="leading-relaxed mt-4">
                All builder subscriptions are billed in advance on a monthly or annual basis. Subscriptions auto-renew unless cancelled before the billing cycle ends.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Buyer Plans</h3>
              <p className="leading-relaxed">
                Buyer plans are free. Premium buyer features may be available in the future with separate pricing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-gold-500" />
                3. Refund Eligibility
              </h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 7-Day Money-Back Guarantee</h3>
              <p className="leading-relaxed mb-4">
                New subscribers are eligible for a full refund within 7 days of their initial subscription purchase, provided:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>No more than 3 property listings have been created</li>
                <li>No more than 10 leads have been accessed</li>
                <li>No chargebacks or disputes have been initiated</li>
                <li>Request is made through our official support channel</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Pro-Rated Refunds (After 7 Days)</h3>
              <p className="leading-relaxed mb-4">
                After the 7-day guarantee period, refunds are calculated on a pro-rated basis for unused subscription time:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Monthly Subscriptions:</strong> Refund = (Days Remaining / Total Days) × Monthly Price</li>
                <li><strong>Annual Subscriptions:</strong> Refund = (Months Remaining / 12) × Annual Price</li>
                <li>Minimum refund amount: ₹500 or the remaining balance, whichever is lower</li>
                <li>Processing fee of ₹200 may apply for annual subscriptions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-6 h-6 text-gold-500" />
                4. Non-Refundable Items
              </h2>
              <p className="leading-relaxed mb-4">
                The following are NOT eligible for refunds:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Used or consumed services (e.g., leads accessed, listings published)</li>
                <li>Add-on services purchased separately (e.g., featured listings, premium placements)</li>
                <li>Subscription renewals beyond the initial 7-day guarantee</li>
                <li>Accounts suspended or terminated due to policy violations</li>
                <li>Processing fees and taxes (GST) already remitted to authorities</li>
                <li>Refund requests made more than 30 days after cancellation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-gold-500" />
                5. Cancellation Policy
              </h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 How to Cancel</h3>
              <p className="leading-relaxed mb-4">
                Subscriptions can be cancelled at any time:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Through your Builder Dashboard → Settings → Billing</li>
                <li>By emailing <a href="mailto:billing@tharaga.co.in" className="text-gold-400 hover:text-gold-300 underline">billing@tharaga.co.in</a></li>
                <li>By calling our support team at <a href="tel:+919876543210" className="text-gold-400 hover:text-gold-300 underline">+91 98765 43210</a></li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Cancellation Effective Date</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>You retain access to all features until the subscription expires</li>
                <li>No new charges will be made after cancellation</li>
                <li>Auto-renewal is disabled immediately upon cancellation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Refund Process</h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1 Request Submission</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Submit refund request via email to <a href="mailto:billing@tharaga.co.in" className="text-gold-400 hover:text-gold-300 underline">billing@tharaga.co.in</a> or through support</li>
                <li>Include your account email, subscription plan, and reason for refund</li>
                <li>Our team will review within 2 business days</li>
                <li>Approved refunds are processed within 7-10 business days</li>
              </ol>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 Refund Methods</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Refunds are credited to the original payment method</li>
                <li>Credit card/debit card refunds: 7-10 business days</li>
                <li>Bank transfer refunds: 5-7 business days</li>
                <li>Digital wallet refunds (Paytm, PhonePe): 3-5 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-6 h-6 text-gold-500" />
                7. Special Circumstances
              </h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.1 Service Interruptions</h3>
              <p className="leading-relaxed">
                If our platform experiences significant downtime (more than 48 hours in a billing cycle), we will issue service credits or pro-rated refunds at our discretion.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.2 Billing Errors</h3>
              <p className="leading-relaxed">
                If you notice billing errors, contact us within 30 days. We will investigate and issue corrections or refunds as appropriate.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.3 Plan Downgrades</h3>
              <p className="leading-relaxed">
                When downgrading to a lower plan, a pro-rated credit will be applied to your account for the difference. Refunds are not issued for downgrades unless you cancel within the 7-day guarantee period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Chargebacks and Disputes</h2>
              <p className="leading-relaxed mb-4">
                Initiating a chargeback or payment dispute may result in:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Immediate account suspension</li>
                <li>Permanent ban from the platform</li>
                <li>Legal action to recover costs and fees</li>
              </ul>
              <p className="leading-relaxed mt-4">
                We encourage direct communication to resolve issues before initiating disputes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. GST and Taxes</h2>
              <p className="leading-relaxed">
                All prices are in Indian Rupees (INR) and exclusive of GST (18%). Refund amounts will include GST for eligible refunds. Tax receipts are provided for all transactions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact for Refunds</h2>
              <p className="leading-relaxed mb-4">
                For refund requests or billing inquiries:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> <a href="mailto:billing@tharaga.co.in" className="text-gold-400 hover:text-gold-300 underline">billing@tharaga.co.in</a></p>
                <p><strong>Phone:</strong> <a href="tel:+919876543210" className="text-gold-400 hover:text-gold-300 underline">+91 98765 43210</a> (Mon-Fri, 10 AM - 6 PM IST)</p>
                <p><strong>Address:</strong> Chennai, Tamil Nadu, India</p>
                <p><strong>Response Time:</strong> 2 business days</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We reserve the right to modify this Refund Policy. Changes will be notified via email and effective immediately. Continued use of our service after changes constitutes acceptance.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-white/20 bg-yellow-500/10 rounded-xl p-6">
              <p className="text-white font-semibold mb-2">💡 Need Help?</p>
              <p className="text-white/90 text-sm">
                Our support team is here to help! Contact us at <a href="mailto:support@tharaga.co.in" className="text-gold-400 hover:text-gold-300 underline">support@tharaga.co.in</a> or visit our <Link href="/help" className="text-gold-400 hover:text-gold-300 underline">Help Center</Link> for more information.
              </p>
            </div>

            <div className="mt-8 text-center text-white/70 text-sm">
              <p>This Refund Policy is governed by the laws of India and the jurisdiction of Chennai, Tamil Nadu.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

