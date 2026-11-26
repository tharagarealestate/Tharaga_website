'use client'

import { useState, useEffect } from 'react'
import { X, Cookie, Shield, Settings } from 'lucide-react'
import Link from 'next/link'

/**
 * GDPR Cookie Consent Banner Component
 * 
 * Features:
 * - Checks localStorage for cookie_consent flag
 * - Shows banner at bottom if not set
 * - Accept/Reject/Manage buttons
 * - Privacy policy link
 * - Conditionally loads analytics based on consent
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showManage, setShowManage] = useState(false)
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null>(null)

  useEffect(() => {
    // Check if consent has been given
    const storedConsent = localStorage.getItem('cookie_consent')
    if (!storedConsent) {
      setShowBanner(true)
    } else {
      setConsent(storedConsent as 'accepted' | 'rejected')
      // Load analytics if accepted
      if (storedConsent === 'accepted') {
        loadAnalytics()
      }
    }
  }, [])

  const loadAnalytics = () => {
    // Only load analytics if consent is accepted
    if (typeof window !== 'undefined' && !window.gtag) {
      // Google Analytics initialization
      const gaId = process.env.NEXT_PUBLIC_GA_ID
      if (gaId) {
        // Initialize gtag
        window.dataLayer = window.dataLayer || []
        function gtag(...args: any[]) {
          window.dataLayer.push(args)
        }
        window.gtag = gtag
        gtag('js', new Date())
        gtag('config', gaId, {
          anonymize_ip: true,
          cookie_flags: 'SameSite=None;Secure',
        })

        // Load Google Analytics script
        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
        document.head.appendChild(script)
      }
    }
  }

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setConsent('accepted')
    setShowBanner(false)
    setShowManage(false)
    loadAnalytics()
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('cookie-consent-accepted'))
  }

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected')
    setConsent('rejected')
    setShowBanner(false)
    setShowManage(false)
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('cookie-consent-rejected'))
  }

  const handleManage = () => {
    setShowManage(true)
  }

  if (!showBanner && !showManage) {
    return null
  }

  return (
    <>
      {showBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[2147483000] bg-gradient-to-r from-primary-900 to-primary-800 border-t border-gold-500/30 shadow-2xl"
          role="dialog"
          aria-label="Cookie Consent"
          aria-modal="true"
        >
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Cookie className="w-5 h-5 text-gold-400" />
                  <h3 className="text-lg font-bold text-white">We Value Your Privacy</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  By clicking &quot;Accept&quot;, you consent to our use of cookies.{' '}
                  <Link
                    href="/privacy"
                    className="text-gold-400 hover:text-gold-300 underline font-medium"
                  >
                    Learn more
                  </Link>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={handleManage}
                  className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                >
                  Manage
                </button>
                <button
                  onClick={handleAccept}
                  className="px-6 py-2 text-sm font-bold text-primary-900 bg-gold-400 hover:bg-gold-300 rounded-lg transition-colors shadow-lg"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManage && (
        <div
          className="fixed inset-0 z-[2147483001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowManage(false)}
        >
          <div
            className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl border border-gold-500/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-gold-400" />
                  <h2 className="text-2xl font-bold text-white">Cookie Preferences</h2>
                </div>
                <button
                  onClick={() => setShowManage(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6 mb-6">
                <div className="bg-primary-800/50 rounded-lg p-4 border border-primary-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Essential Cookies</h3>
                    <span className="text-xs text-gold-400 bg-gold-400/20 px-2 py-1 rounded">Always Active</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    These cookies are necessary for the website to function and cannot be switched off.
                    They include authentication, security, and basic site functionality.
                  </p>
                </div>

                <div className="bg-primary-800/50 rounded-lg p-4 border border-primary-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">Analytics Cookies</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      consent === 'accepted' 
                        ? 'text-emerald-400 bg-emerald-400/20' 
                        : 'text-gray-400 bg-gray-400/20'
                    }`}>
                      {consent === 'accepted' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    These cookies help us understand how visitors interact with our website by collecting 
                    and reporting information anonymously.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAccept}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gold-400 hover:bg-gold-300 rounded-lg transition-colors"
                    >
                      Enable Analytics
                    </button>
                    <button
                      onClick={handleReject}
                      className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                    >
                      Disable Analytics
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-primary-700">
                <Link
                  href="/privacy"
                  className="text-sm text-gold-400 hover:text-gold-300 underline"
                >
                  View Privacy Policy
                </Link>
                <button
                  onClick={() => setShowManage(false)}
                  className="px-6 py-2 text-sm font-semibold text-white bg-gold-400 hover:bg-gold-300 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}



