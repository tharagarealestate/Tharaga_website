'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, Mail, Phone, DollarSign, MapPin, Users, 
  Calendar, CheckCircle, Loader2, Sparkles, ArrowRight 
} from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { PremiumButton } from '@/components/ui/premium-button'

interface PropertyMarketingFormProps {
  propertyId: string
  propertyTitle?: string
  propertyLocation?: string
  onSuccess?: (leadId: string) => void
}

interface FormData {
  name: string
  email: string
  phone: string
  budget: string
  preferredLocation: string
  propertyType: string
  bhkPreference: string
  timeline: string
  additionalInfo: string
}

export function PropertyMarketingForm({
  propertyId,
  propertyTitle,
  propertyLocation,
  onSuccess
}: PropertyMarketingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    budget: '',
    preferredLocation: propertyLocation || '',
    propertyType: '',
    bhkPreference: '',
    timeline: '',
    additionalInfo: '',
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Submit form for analysis
      const response = await fetch('/api/marketing/form-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          form_data: formData,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit form')
      }

      setSubmitted(true)
      if (onSuccess && data.lead_id) {
        onSuccess(data.lead_id)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      console.error('Form submission error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <GlassCard variant="gold" glow className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Thank You! 🎉
          </h3>
          <p className="text-slate-300 mb-2">
            We've received your information and analyzed your preferences.
          </p>
          <p className="text-slate-400 text-sm">
            Check your email for personalized property information!
          </p>
        </motion.div>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="light" glow className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-amber-300" />
          <h3 className="text-2xl font-bold text-white">
            Get Personalized Property Information
          </h3>
        </div>
        <p className="text-slate-300">
          Fill out this form and we'll analyze your preferences to send you tailored information about this property.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
            placeholder="+91 98765 43210"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Budget Range
          </label>
          <select
            value={formData.budget}
            onChange={(e) => handleChange('budget', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
          >
            <option value="">Select budget range</option>
            <option value="under-50L">Under ₹50 Lakhs</option>
            <option value="50L-1Cr">₹50 Lakhs - ₹1 Crore</option>
            <option value="1Cr-2Cr">₹1 Crore - ₹2 Crores</option>
            <option value="2Cr-5Cr">₹2 Crores - ₹5 Crores</option>
            <option value="above-5Cr">Above ₹5 Crores</option>
          </select>
        </div>

        {/* Preferred Location */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Preferred Location
          </label>
          <input
            type="text"
            value={formData.preferredLocation}
            onChange={(e) => handleChange('preferredLocation', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
            placeholder="e.g., Chennai, Coimbatore"
          />
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Property Type Preference
          </label>
          <select
            value={formData.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
          >
            <option value="">Select property type</option>
            <option value="apartment">Apartment</option>
            <option value="villa">Villa</option>
            <option value="plot">Plot</option>
            <option value="penthouse">Penthouse</option>
            <option value="studio">Studio</option>
          </select>
        </div>

        {/* BHK Preference */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            BHK Preference
          </label>
          <select
            value={formData.bhkPreference}
            onChange={(e) => handleChange('bhkPreference', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
          >
            <option value="">Select BHK</option>
            <option value="1RK">1RK</option>
            <option value="1BHK">1BHK</option>
            <option value="2BHK">2BHK</option>
            <option value="3BHK">3BHK</option>
            <option value="4BHK">4BHK</option>
            <option value="5BHK+">5BHK+</option>
          </select>
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Purchase Timeline
          </label>
          <select
            value={formData.timeline}
            onChange={(e) => handleChange('timeline', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all"
          >
            <option value="">Select timeline</option>
            <option value="immediate">Immediate (0-1 months)</option>
            <option value="short-term">Short-term (1-3 months)</option>
            <option value="medium-term">Medium-term (3-6 months)</option>
            <option value="long-term">Long-term (6+ months)</option>
            <option value="exploring">Just exploring</option>
          </select>
        </div>

        {/* Additional Info */}
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Additional Information
          </label>
          <textarea
            value={formData.additionalInfo}
            onChange={(e) => handleChange('additionalInfo', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800/50 border-2 border-amber-300/30 rounded-lg text-white placeholder:text-slate-400 focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 transition-all resize-none"
            placeholder="Tell us about your specific requirements, preferences, or questions..."
          />
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <p className="text-red-400 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Submit Button */}
        <PremiumButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          icon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          iconPosition="right"
          shimmer
        >
          {loading ? 'Analyzing & Sending...' : 'Get Personalized Information'}
        </PremiumButton>

        <p className="text-xs text-slate-400 text-center">
          By submitting this form, you agree to receive property information via email.
        </p>
      </form>
    </GlassCard>
  )
}











