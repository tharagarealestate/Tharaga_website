'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, Scale, AlertCircle, CheckCircle, Users, Building2 } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Terms of Service' }
        ]} />

        <div className="max-w-4xl mx-auto mt-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6">
              <Scale className="w-4 h-4 text-gold-300" />
              <span className="text-gold-300 text-sm font-medium">Legal Terms</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-300">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 space-y-8 text-white/90">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-gold-500" />
                1. Acceptance of Terms
              </h2>
              <p className="leading-relaxed">
                By accessing or using Tharaga ("Platform", "Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all users, including buyers, builders, and visitors to our platform.
              </p>
              <p className="leading-relaxed mt-4">
                Tharaga is an AI-powered zero-commission real estate platform connecting verified builders with home seekers in Chennai, Tamil Nadu. Our goal is to provide a broker-free, transparent real estate marketplace.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-gold-500" />
                2. User Accounts and Registration
              </h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Account Creation</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You must provide accurate, complete, and current information</li>
                <li>You must be at least 18 years old to create an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to notify us immediately of any unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Builder Verification</h3>
              <p className="leading-relaxed">
                Builders must provide valid RERA registration numbers, GSTIN, and verification documents. We reserve the right to verify all builder credentials and reject or suspend accounts that fail verification or violate RERA guidelines.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-gold-500" />
                3. Platform Usage
              </h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Permitted Use</h3>
              <p className="leading-relaxed mb-4">You may use our platform to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Browse and search for properties in Chennai and Tamil Nadu</li>
                <li>List verified properties (for builders)</li>
                <li>Connect directly with verified builders or qualified buyers</li>
                <li>Access AI-powered property matching and market insights</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Prohibited Activities</h3>
              <p className="leading-relaxed mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Post false, misleading, or fraudulent property listings</li>
                <li>Impersonate another person or entity</li>
                <li>Violate any applicable laws, including RERA regulations in Tamil Nadu</li>
                <li>Use automated systems to scrape or extract data without permission</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Engage in broker activities (platform is broker-free)</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Harass, threaten, or abuse other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Property Listings</h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Builder Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Ensure all property listings are accurate, complete, and up-to-date</li>
                <li>Comply with RERA regulations for Chennai properties</li>
                <li>Obtain necessary approvals and certifications before listing</li>
                <li>Respond to buyer inquiries in a timely manner</li>
                <li>Maintain valid RERA registration throughout listing period</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Content Ownership</h3>
              <p className="leading-relaxed">
                Builders retain ownership of property content but grant Tharaga a license to display, distribute, and promote listings on our platform and partner channels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Pricing and Payments</h2>
              <p className="leading-relaxed mb-4">
                Our platform operates on a zero-commission model for buyers. Builders may subscribe to premium plans with transparent pricing:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Buyer Plans:</strong> Free access to property search and matching</li>
                <li><strong>Builder Plans:</strong> Subscription-based pricing with monthly/annual options</li>
                <li>All prices are in Indian Rupees (INR) and exclusive of GST where applicable</li>
                <li>Subscriptions auto-renew unless cancelled before the billing cycle</li>
                <li>Refunds are governed by our <Link href="/refund" className="text-gold-400 hover:text-gold-300 underline">Refund Policy</Link></li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-gold-500" />
                6. Disclaimers and Limitations
              </h2>
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1 Platform Disclaimer</h3>
              <p className="leading-relaxed">
                Tharaga acts as a technology platform connecting buyers and builders. We do not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Guarantee the accuracy of property listings</li>
                <li>Verify all property details or conduct site inspections</li>
                <li>Provide legal, financial, or real estate advisory services</li>
                <li>Guarantee successful property transactions</li>
                <li>Act as a broker or intermediary in transactions</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 Limitation of Liability</h3>
              <p className="leading-relaxed">
                To the maximum extent permitted by law, Tharaga shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Intellectual Property</h2>
              <p className="leading-relaxed">
                All content on the Tharaga platform, including logos, designs, text, graphics, and software, is owned by Tharaga or its licensors. You may not copy, modify, or distribute our content without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Termination</h2>
              <p className="leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account if you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate these Terms or our policies</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Fail to pay subscription fees (for builders)</li>
                <li>Provide false or misleading information</li>
              </ul>
              <p className="leading-relaxed mt-4">
                You may terminate your account at any time by contacting us or using account deletion features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms are governed by the laws of India and the jurisdiction of Chennai, Tamil Nadu. Any disputes shall be subject to the exclusive jurisdiction of courts in Chennai.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Terms</h2>
              <p className="leading-relaxed">
                We may modify these Terms at any time. Material changes will be notified via email or platform notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-gold-500" />
                11. Contact Information
              </h2>
              <p className="leading-relaxed mb-4">
                For questions about these Terms, contact us:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> <a href="mailto:tharagarealestate@gmail.com" className="text-gold-400 hover:text-gold-300 underline">tharagarealestate@gmail.com</a></p>
                <p><strong>Address:</strong> Chennai, Tamil Nadu, India</p>
                <p><strong>Phone:</strong> <a href="tel:+918870980839" className="text-gold-400 hover:text-gold-300 underline">+91 88709 80839</a></p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-white/20 text-center text-white/70 text-sm">
              <p>By using Tharaga, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

