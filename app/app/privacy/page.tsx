'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Lock, Eye, Database, Users, FileText } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Privacy Policy' }
        ]} />

        <div className="max-w-4xl mx-auto mt-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/20 backdrop-blur-sm border border-gold-500/30 rounded-full mb-6">
              <Shield className="w-4 h-4 text-gold-300" />
              <span className="text-gold-300 text-sm font-medium">Privacy & Security</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-300">
              Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Content */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 md:p-12 space-y-8 text-white/90">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-gold-500" />
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                Tharaga ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform located at <Link href="https://tharaga.co.in" className="text-gold-400 hover:text-gold-300 underline">tharaga.co.in</Link>.
              </p>
              <p className="leading-relaxed mt-4">
                As India's first AI-powered zero-commission real estate platform focused on Chennai, Tamil Nadu, we understand the importance of data privacy and security in the real estate industry. This policy complies with the Information Technology Act, 2000, and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-gold-500" />
                2. Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Buyers:</strong> Name, email address, phone number, location preferences, budget range, property requirements, and communication preferences</li>
                <li><strong>Builders:</strong> Company name, business registration details (GSTIN, RERA number), contact information, property listings, and verification documents</li>
                <li><strong>Newsletter Subscribers:</strong> Email address and subscription preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Usage Information</h3>
              <p className="leading-relaxed">
                We automatically collect information about how you interact with our platform, including property searches, saved properties, page views, session duration, device information, IP address, and browser type.
              </p>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Property Information</h3>
              <p className="leading-relaxed">
                When you list a property, we collect property details, images, location data, pricing information, and related documents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-gold-500" />
                3. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Facilitate direct connections between buyers and verified builders</li>
                <li>Match property requirements using AI-powered algorithms</li>
                <li>Send property recommendations, market insights, and weekly newsletters</li>
                <li>Verify builder credentials and property listings</li>
                <li>Process payments and manage subscriptions</li>
                <li>Improve our platform through analytics and user feedback</li>
                <li>Send important updates about your account, bookings, or platform changes</li>
                <li>Comply with legal obligations, including RERA compliance for Chennai properties</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-gold-500" />
                4. Data Sharing and Disclosure
              </h2>
              <p className="leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>With Verified Builders/Buyers:</strong> To facilitate property inquiries and communications</li>
                <li><strong>Service Providers:</strong> With trusted third-party services for payment processing, email delivery, analytics, and hosting</li>
                <li><strong>Legal Requirements:</strong> When required by law, court orders, or government regulations in Tamil Nadu</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-gold-500" />
                5. Data Security
              </h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>End-to-end encryption for sensitive data transmission</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Multi-factor authentication for builder accounts</li>
                <li>Compliance with RERA data protection requirements for Chennai real estate</li>
              </ul>
              <p className="leading-relaxed mt-4 text-yellow-300">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights (Chennai Platform Focus)</h2>
              <p className="leading-relaxed mb-4">
                Under Indian law and our commitment to data privacy, you have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing emails and newsletters</li>
                <li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Withdraw Consent:</strong> Revoke consent for data processing where applicable</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise these rights, contact us at <a href="mailto:tharagarealestate@gmail.com" className="text-gold-400 hover:text-gold-300 underline">tharagarealestate@gmail.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p className="leading-relaxed">
                We use cookies and similar technologies to enhance your experience, analyze platform usage, and deliver personalized content. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Third-Party Links</h2>
              <p className="leading-relaxed">
                Our platform may contain links to third-party websites, including Chennai-based real estate portals and government websites (RERA, CMRL). We are not responsible for their privacy practices. Please review their privacy policies separately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our platform is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification. Continued use of our platform after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
              <p className="leading-relaxed">
                For privacy-related questions or concerns, contact us:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> <a href="mailto:tharagarealestate@gmail.com" className="text-gold-400 hover:text-gold-300 underline">tharagarealestate@gmail.com</a></p>
                <p><strong>Address:</strong> Chennai, Tamil Nadu, India</p>
                <p><strong>Phone:</strong> <a href="tel:+918870980839" className="text-gold-400 hover:text-gold-300 underline">+91 88709 80839</a></p>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-white/20 text-center text-white/70 text-sm">
              <p>This Privacy Policy is governed by the laws of India and the jurisdiction of Chennai, Tamil Nadu.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

