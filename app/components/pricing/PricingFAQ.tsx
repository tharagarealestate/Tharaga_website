'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface PricingFAQProps {
  activeTab: 'builder' | 'buyer'
}

interface FAQItem {
  question: string
  answer: string
}

export default function PricingFAQ({ activeTab }: PricingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs: FAQItem[] = activeTab === 'builder'
    ? [
        {
          question: 'Can I switch plans anytime?',
          answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.'
        },
        {
          question: 'What happens if I exceed my plan limits?',
          answer: 'We\'ll notify you when you\'re approaching your limits. You can upgrade your plan or we can work out a custom solution for your needs.'
        },
        {
          question: 'How does the commission model work?',
          answer: 'For Builder Free and Builder Pro (Hybrid), we charge a commission only on successful deals. The commission is calculated as a percentage of the deal value and is due after the transaction is completed.'
        },
        {
          question: 'Is there a setup fee?',
          answer: 'No setup fees for any plan. You only pay for your subscription (if applicable) and commissions on successful deals.'
        },
        {
          question: 'Do you offer refunds?',
          answer: 'Yes, we offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us within 30 days for a full refund.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, UPI, and net banking through Razorpay. Enterprise customers can also pay via bank transfer.'
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.'
        },
        {
          question: 'What support is included?',
          answer: 'Free plan includes community support. Pro plan includes priority email support (4-hour response time). Enterprise includes a dedicated account manager and 24/7 phone support.'
        }
      ]
    : [
        {
          question: 'Can I try Premium before paying?',
          answer: 'Yes! We offer a 7-day free trial for the Premium plan. No credit card required. Cancel anytime during the trial.'
        },
        {
          question: 'What happens to my saved properties if I cancel?',
          answer: 'Your saved properties will remain accessible for 30 days after cancellation. After that, you\'ll need to resubscribe to access them.'
        },
        {
          question: 'How does lawyer consultation work?',
          answer: 'Premium users get 3 free text-based questions per month. VIP users get unlimited consultations via text, phone, or video calls. You can book consultations directly through the platform.'
        },
        {
          question: 'What is the document vault?',
          answer: 'The document vault is a secure storage space for your property documents, contracts, and verification certificates. Available for Premium and VIP users.'
        },
        {
          question: 'Is there a free trial for VIP?',
          answer: 'VIP plan doesn\'t have a free trial, but you can try Premium free for 7 days. If you upgrade to VIP within the first month, we\'ll apply a discount.'
        },
        {
          question: 'Can I upgrade from Free to Premium?',
          answer: 'Absolutely! You can upgrade at any time. Your billing cycle will be prorated, so you only pay for the remaining time.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, UPI, and net banking through Razorpay. All payments are processed securely.'
        },
        {
          question: 'Do you offer refunds?',
          answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with Premium or VIP, contact us within 30 days for a full refund.'
        }
      ]

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='text-center mb-12'>
        <h2 className='font-display text-4xl sm:text-5xl font-bold text-white mb-4'>
          Frequently Asked Questions
        </h2>
        <p className='text-xl text-gray-300'>
          Everything you need to know about our pricing
        </p>
      </div>

      <div className='space-y-4'>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          
          return (
            <div
              key={index}
              className='backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/15'
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className='w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/5 transition-colors'
              >
                <span className='text-white font-semibold text-lg pr-8'>
                  {faq.question}
                </span>
                <div className='flex-shrink-0'>
                  {isOpen ? (
                    <ChevronUp className='w-6 h-6 text-gold-400' />
                  ) : (
                    <ChevronDown className='w-6 h-6 text-gray-400' />
                  )}
                </div>
              </button>
              
              {isOpen && (
                <div className='px-6 pb-6'>
                  <div className='text-gray-300 leading-relaxed'>
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

