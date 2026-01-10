'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search, MessageCircle, Book, Video, HelpCircle, ChevronDown, ChevronUp, Mail, Phone, FileText } from 'lucide-react'
import Breadcrumb from '@/components/Breadcrumb'
import { PageWrapper } from '@/components/ui'

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [openQuestion, setOpenQuestion] = useState<string | null>(null)

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <Book className="w-5 h-5" />,
      questions: [
        { id: 'q1', question: 'How do I create an account?', answer: 'Click "Sign Up" on the homepage, choose between Builder or Buyer account, provide your email and phone number, verify your phone via OTP, and complete your profile.' },
        { id: 'q2', question: 'What is the difference between Builder and Buyer accounts?', answer: 'Builders can list properties, manage leads, and access analytics. Buyers can search properties, save favorites, and connect directly with verified builders.' },
        { id: 'q3', question: 'Is Tharaga free for buyers?', answer: 'Yes! Buyer accounts are completely free. You can search unlimited properties, save favorites, and connect with builders at no cost.' }
      ]
    },
    {
      id: 'builder',
      title: 'For Builders',
      icon: <FileText className="w-5 h-5" />,
      questions: [
        { id: 'q4', question: 'How do I list my property?', answer: 'Log into your Builder Dashboard, click "Add Property", fill in property details (location, price, specifications), upload images and documents, and submit for verification. Once verified, your listing goes live.' },
        { id: 'q5', question: 'What are the subscription plans?', answer: 'We offer three plans: Starter (₹999/month), Professional (₹2,999/month), and Enterprise (₹14,999/month). Annual plans offer 17% discount. See our Pricing page for details.', link: '/pricing' },
        { id: 'q6', question: 'How does lead scoring work?', answer: 'Our AI analyzes buyer behavior, engagement level, budget alignment, and property preferences to assign a score from 0-10. Higher scores indicate more qualified leads.' },
        { id: 'q7', question: 'Do you charge commission?', answer: 'No! Tharaga is a zero-commission platform. You pay only the subscription fee - no hidden charges or commission on deals.' }
      ]
    },
    {
      id: 'buyer',
      title: 'For Buyers',
      icon: <HelpCircle className="w-5 h-5" />,
      questions: [
        { id: 'q8', question: 'How do I search for properties?', answer: 'Use the Property Search page, apply filters (location, price, bedrooms, property type), save properties you like, and contact builders directly through the platform.' },
        { id: 'q9', question: 'Are all builders verified?', answer: 'Yes, all builders are RERA-verified. We verify GSTIN, RERA registration, and company documents before allowing listings on our platform.' },
        { id: 'q10', question: 'Can I schedule site visits?', answer: 'Yes! Once you connect with a builder, you can schedule site visits directly through your dashboard. Builders receive notifications and can confirm availability.' }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: <Video className="w-5 h-5" />,
      questions: [
        { id: 'q11', question: 'I forgot my password. How do I reset it?', answer: 'Click "Forgot Password" on the login page, enter your email, check your inbox for reset link, and follow the instructions to set a new password.' },
        { id: 'q12', question: 'The website is not loading. What should I do?', answer: 'Check your internet connection, clear browser cache, try a different browser, disable browser extensions, or contact support if the issue persists.' },
        { id: 'q13', question: 'Can I use Tharaga on mobile?', answer: 'Yes! Our platform is fully responsive and works on all mobile devices. We also have mobile apps for iOS and Android (coming soon).' }
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Payments',
      icon: <FileText className="w-5 h-5" />,
      questions: [
        { id: 'q14', question: 'What payment methods do you accept?', answer: 'We accept credit cards, debit cards, UPI, net banking, and digital wallets (Paytm, PhonePe). All payments are processed securely via Razorpay.' },
        { id: 'q15', question: 'Can I get a refund?', answer: 'Yes, we offer a 7-day money-back guarantee for new subscriptions. See our Refund Policy for details and eligibility.', link: '/refund' },
        { id: 'q16', question: 'When will I be charged?', answer: 'Subscriptions are billed in advance monthly or annually. You\'ll receive an email invoice before each billing cycle. Auto-renewal can be disabled anytime.' }
      ]
    }
  ]

  const filteredCategories = categories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0 || !searchQuery)

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Help Center' }
        ]} />

        <div className="max-w-5xl mx-auto mt-8">
          <div className="text-center mb-12">
            <PageHeader
              title="Help Center"
              description="Find answers to common questions or contact our support team"
              className="text-center mb-8"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${DESIGN_TOKENS.colors.background.card} backdrop-blur-sm border ${DESIGN_TOKENS.effects.border.amberClass} rounded-full mb-6`}>
                <HelpCircle className={`w-4 h-4 ${DESIGN_TOKENS.colors.text.accent}`} />
                <span className={`${DESIGN_TOKENS.colors.text.accent} text-sm font-medium`}>AI-Powered Support</span>
              </div>
            </PageHeader>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for help..."
                  className={`w-full pl-12 pr-4 py-4 rounded-xl ${DESIGN_TOKENS.colors.background.card} border ${DESIGN_TOKENS.colors.border.default} backdrop-blur-sm ${DESIGN_TOKENS.colors.text.primary} placeholder:${DESIGN_TOKENS.colors.text.muted} focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                />
              </div>
            </div>
          </div>

          {/* FAQ Categories */}
          <SectionWrapper noPadding>
            <div className="space-y-6">
            {filteredCategories.map((category) => (
              <GlassCard key={category.id} variant="dark" glow border className="p-6">
                <button
                  onClick={() => setOpenCategory(openCategory === category.id ? null : category.id)}
                  className="w-full flex items-center justify-between text-left mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${DESIGN_TOKENS.colors.background.card} flex items-center justify-center ${DESIGN_TOKENS.colors.text.accent}`}>
                      {category.icon}
                    </div>
                    <h2 className={`text-2xl font-bold ${DESIGN_TOKENS.colors.text.primary}`}>{category.title}</h2>
                  </div>
                  {openCategory === category.id ? (
                    <ChevronUp className={`w-6 h-6 ${DESIGN_TOKENS.colors.text.secondary}`} />
                  ) : (
                    <ChevronDown className={`w-6 h-6 ${DESIGN_TOKENS.colors.text.secondary}`} />
                  )}
                </button>

                {openCategory === category.id && (
                  <div className="space-y-4 mt-6">
                    {category.questions.map((item) => (
                      <div key={item.id} className="border-t border-white/10 pt-4">
                        <button
                          onClick={() => setOpenQuestion(openQuestion === item.id ? null : item.id)}
                          className="w-full flex items-center justify-between text-left mb-2"
                        >
                          <h3 className={`text-lg font-semibold ${DESIGN_TOKENS.colors.text.primary}`}>{item.question}</h3>
                          {openQuestion === item.id ? (
                            <ChevronUp className={`w-5 h-5 ${DESIGN_TOKENS.colors.text.muted} flex-shrink-0 ml-4`} />
                          ) : (
                            <ChevronDown className={`w-5 h-5 ${DESIGN_TOKENS.colors.text.muted} flex-shrink-0 ml-4`} />
                          )}
                        </button>
                        {openQuestion === item.id && (
                          <div className={`${DESIGN_TOKENS.colors.text.secondary} leading-relaxed mt-3`}>
                            <p>{item.answer}</p>
                            {(item as any).link && (
                              <Link href={(item as any).link} className={`${DESIGN_TOKENS.colors.text.accent} hover:text-amber-200 underline mt-2 inline-block`}>
                                Learn more →
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
          </SectionWrapper>

          {/* Contact Support */}
          <SectionWrapper noPadding className="mt-12">
            <GlassCard variant="gold" glow border className="p-8 text-center">
              <MessageCircle className={`w-12 h-12 ${DESIGN_TOKENS.colors.text.accent} mx-auto mb-4`} />
              <h2 className={`${DESIGN_TOKENS.typography.h2} mb-4`}>Still Need Help?</h2>
              <p className={`${DESIGN_TOKENS.colors.text.secondary} mb-6`}>
                Our support team is available to assist you 24/7
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumButton variant="gold" size="md" asChild>
                  <a href="mailto:tharagarealestate@gmail.com">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Support
                  </a>
                </PremiumButton>
                <PremiumButton variant="secondary" size="md" asChild>
                  <a href="tel:+918870980839">
                    <Phone className="w-5 h-5 mr-2" />
                    Call Us
                  </a>
                </PremiumButton>
              </div>
            </GlassCard>
          </SectionWrapper>
        </div>
      </div>
    </PageWrapper>
  )
}

