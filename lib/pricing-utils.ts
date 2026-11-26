import { PRICING_CONFIG } from './pricing-config'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Helper to get Supabase client (works in both client and server contexts)
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase environment variables are not set')
  }
  
  return createClient(url, key)
}

// ============================================
// SUBSCRIPTION CALCULATIONS
// ============================================

export function calculateSubscriptionCost(
  planType: string,
  billingCycle: 'monthly' | 'yearly',
  pricingModel?: 'subscription' | 'hybrid' // For Builder Pro
): {
  amount: number
  discount: number
  savings: number
  description: string
} {
  // Parse plan type
  const [role, tier] = planType.split('_') // e.g., 'builder_pro'
  
  // Type-safe access to pricing config
  const roleConfig = role === 'builder' ? PRICING_CONFIG.builder : PRICING_CONFIG.buyer
  const plan = roleConfig[tier as keyof typeof roleConfig] as any
  
  if (!plan) throw new Error(`Invalid plan type: ${planType}`)
  
  // Handle Builder Pro's dual model
  let priceConfig = plan.price
  if (tier === 'pro' && role === 'builder') {
    priceConfig = pricingModel === 'hybrid' 
      ? plan.models.hybrid.price 
      : plan.models.subscription.price
  }
  
  const monthlyPrice = priceConfig.monthly
  const yearlyPrice = priceConfig.yearly
  
  if (billingCycle === 'monthly') {
    return {
      amount: monthlyPrice,
      discount: 0,
      savings: 0,
      description: priceConfig.display
    }
  } else {
    const monthlyTotal = monthlyPrice * 12
    const savings = monthlyTotal - yearlyPrice
    const discount = Math.round((savings / monthlyTotal) * 100)
    
    return {
      amount: yearlyPrice,
      discount,
      savings,
      description: `${priceConfig.displayYearly} - Save ${discount}%`
    }
  }
}

// ============================================
// COMMISSION CALCULATIONS
// ============================================

export function calculateCommission(
  dealValue: number,
  planType: string,
  pricingModel?: 'subscription' | 'hybrid'
): {
  rate: number
  amount: number
  capped: boolean
  cappedAmount?: number
} {
  // Determine commission rate
  let rate = 0
  
  if (planType === 'builder_free') {
    rate = PRICING_CONFIG.commissionRates.standard // 12.5%
  } else if (planType === 'builder_pro' && pricingModel === 'hybrid') {
    rate = PRICING_CONFIG.commissionRates.promotional // 10%
  } else if (planType === 'builder_enterprise' || 
             (planType === 'builder_pro' && pricingModel === 'subscription')) {
    rate = 0 // No commission
  }
  
  // Apply premium rate for high-value deals
  if (dealValue > 50000000 && rate > 0) {
    rate = PRICING_CONFIG.commissionRates.premium // 15%
  }
  
  // Calculate commission
  let commissionAmount = Math.round(dealValue * rate / 100)
  
  // Apply cap
  const cap = PRICING_CONFIG.commissionRates.capPerDeal
  const capped = commissionAmount > cap
  
  if (capped) {
    commissionAmount = cap
  }
  
  return {
    rate,
    amount: commissionAmount,
    capped,
    cappedAmount: capped ? cap : undefined
  }
}

// ============================================
// LAWYER SERVICE PAYMENTS
// ============================================

export function calculateLawyerVerificationPayment(
  documentType: string
): {
  buyerPays: number
  lawyerReceives: number
  platformFee: number
  turnaroundHours: number
} {
  const service = (PRICING_CONFIG.lawyerServices.verification as any)[documentType]
  
  if (!service) throw new Error(`Invalid document type: ${documentType}`)
  
  return {
    buyerPays: service.buyerPays,
    lawyerReceives: service.lawyerReceives,
    platformFee: service.platformFee,
    turnaroundHours: service.turnaroundHours
  }
}

export function calculateLawyerConsultationPayment(
  consultationType: string
): {
  buyerPays: number
  lawyerReceives: number
  platformFee: number
} {
  const service = (PRICING_CONFIG.lawyerServices.consultation as any)[consultationType]
  
  if (!service) throw new Error(`Invalid consultation type: ${consultationType}`)
  
  return {
    buyerPays: service.buyerPays,
    lawyerReceives: service.lawyerReceives,
    platformFee: service.platformFee
  }
}

// ============================================
// FEATURE ACCESS CONTROL
// ============================================

/**
 * Check if user has access to a specific feature
 * Can be used with or without Supabase client (for client-side checks)
 */
export async function checkFeatureAccess(
  userId: string,
  featureName: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  const supabase = supabaseClient || getSupabaseClient()
  
  // Get user's current subscription
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select(`
      plan_id,
      pricing_plans (
        plan_type,
        features
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (error || !subscription) return false // No active subscription
  
  const features = (subscription.pricing_plans as any)?.features
  
  if (!features) return false
  
  // Check if feature exists and is enabled
  const featureValue = features[featureName]
  return featureValue === true || 
         featureValue === 'advanced' ||
         featureValue === 'unlimited' ||
         featureValue === 'ai_powered' ||
         featureValue === 'custom'
}

/**
 * Check feature limits and current usage
 */
export async function checkFeatureLimit(
  userId: string,
  limitType: string,
  supabaseClient?: SupabaseClient
): Promise<{
  allowed: boolean
  current: number
  limit: number | null
  remaining: number | null
}> {
  const supabase = supabaseClient || getSupabaseClient()
  
  // Get user's subscription limits
  const { data: subscription, error } = await supabase
    .from('user_subscriptions')
    .select(`
      plan_id,
      pricing_plans (
        plan_type,
        limits
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (error || !subscription) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 }
  }
  
  const limits = (subscription.pricing_plans as any)?.limits
  
  if (!limits) {
    return { allowed: false, current: 0, limit: 0, remaining: 0 }
  }
  
  const limit = limits[limitType]
  
  // If limit is null, it means unlimited
  if (limit === null) {
    return { allowed: true, current: 0, limit: null, remaining: null }
  }
  
  // Get current usage based on limit type
  let current = 0
  
  switch (limitType) {
    case 'properties_per_project':
    case 'property_limit': {
      const { count: propertyCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', userId)
      current = propertyCount || 0
      break
    }
      
    case 'saved_properties': {
      // Check buyer_profiles table for saved properties
      const { data: profile } = await supabase
        .from('buyer_profiles')
        .select('saved_properties')
        .eq('user_id', userId)
        .single()
      
      if (profile?.saved_properties) {
        current = Array.isArray(profile.saved_properties) 
          ? profile.saved_properties.length 
          : 0
      }
      break
    }
      
    case 'team_members': {
      // Implement team member count logic
      // For now, return 1 as placeholder
      current = 1
      break
    }
    
    case 'leads_per_month': {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const { count: leadCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('builder_id', userId)
        .gte('created_at', startOfMonth.toISOString())
      
      current = leadCount || 0
      break
    }
  }
  
  const remaining = limit - current
  const allowed = remaining > 0
  
  return { allowed, current, limit, remaining }
}

// ============================================
// AFFILIATE COMMISSIONS
// ============================================

export function calculateAffiliateCommission(
  affiliateType: string,
  transactionValue: number
): {
  commissionAmount: number
  commissionType: string
  rate?: number
} {
  const config = (PRICING_CONFIG.affiliates as any)[affiliateType]
  
  if (!config) throw new Error(`Invalid affiliate type: ${affiliateType}`)
  
  if (config.commissionType === 'fixed') {
    // Check minimum transaction value
    if (affiliateType === 'bank_loan' && transactionValue < config.minLoanValue) {
      return { commissionAmount: 0, commissionType: 'fixed' }
    }
    
    return {
      commissionAmount: config.amount,
      commissionType: 'fixed'
    }
  } else {
    // Percentage-based
    const amount = Math.round(transactionValue * config.rate / 100)
    
    return {
      commissionAmount: amount,
      commissionType: 'percentage',
      rate: config.rate
    }
  }
}

// ============================================
// INVOICE GENERATION
// ============================================

export interface InvoiceItem {
  description: string
  amount: number
  quantity?: number
}

export interface BillingDetails {
  gstNumber?: string
  address?: any
}

export function generateInvoiceBreakdown(
  items: InvoiceItem[],
  billingDetails: BillingDetails = {}
): {
  lineItems: Array<{
    description: string
    quantity: number
    unit_price: number
    amount: number
  }>
  subtotal: number
  gst: number
  total: number
  gstApplicable: boolean
} {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.amount * (item.quantity || 1))
  }, 0)
  
  // Calculate GST (18%)
  const gstApplicable = PRICING_CONFIG.gst.applicable
  const gstAmount = gstApplicable ? Math.round(subtotal * PRICING_CONFIG.gst.rate / 100) : 0
  
  // Total
  const total = subtotal + gstAmount
  
  // Format line items
  const lineItems = items.map(item => ({
    description: item.description,
    quantity: item.quantity || 1,
    unit_price: item.amount,
    amount: item.amount * (item.quantity || 1)
  }))
  
  return {
    lineItems,
    subtotal,
    gst: gstAmount,
    total,
    gstApplicable
  }
}

// ============================================
// RAZORPAY INTEGRATION HELPERS
// ============================================

export async function createRazorpaySubscription(
  planType: string,
  billingCycle: 'monthly' | 'yearly',
  pricingModel?: 'subscription' | 'hybrid'
): Promise<{
  subscriptionId: string
  amount: number
}> {
  const cost = calculateSubscriptionCost(planType, billingCycle, pricingModel)
  const { subtotal, gst, total } = generateInvoiceBreakdown(
    [{ description: `${planType} - ${billingCycle}`, amount: cost.amount }],
    {}
  )
  
  // Call your existing Razorpay API
  const response = await fetch('/api/payments/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      planType,
      billingCycle,
      amount: total,
      pricingModel
    })
  })
  
  if (!response.ok) {
    throw new Error(`Failed to create subscription: ${response.statusText}`)
  }
  
  const data = await response.json()
  
  return {
    subscriptionId: data.subscription_id,
    amount: total
  }
}

export async function processCommissionPayment(
  userId: string,
  leadId: string,
  dealValue: number,
  propertyId?: string,
  supabaseClient?: SupabaseClient
): Promise<void> {
  const supabase = supabaseClient || getSupabaseClient()
  
  // Get user's plan
  const { data: subscription, error: subError } = await supabase
    .from('user_subscriptions')
    .select(`
      pricing_plans (
        plan_type
      ),
      pricing_model
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (subError || !subscription) {
    throw new Error('No active subscription found')
  }
  
  const planType = (subscription.pricing_plans as any)?.plan_type
  const pricingModel = subscription.pricing_model
  
  // Calculate commission
  const commission = calculateCommission(dealValue, planType, pricingModel)
  
  if (commission.amount === 0) return // No commission to process
  
  // Create commission transaction record
  const { error: insertError } = await supabase.from('commission_transactions').insert({
    user_id: userId,
    lead_id: leadId,
    property_id: propertyId || null,
    deal_value: dealValue,
    commission_rate: commission.rate,
    commission_amount: commission.amount,
    status: 'pending'
  })
  
  if (insertError) {
    throw new Error(`Failed to create commission transaction: ${insertError.message}`)
  }
  
  // Trigger Razorpay payment collection (implement based on your flow)
  // This could be automatic deduction or manual invoice
  // For now, we just log it - implement your payment collection logic here
  console.log(`Commission payment pending: ₹${commission.amount} for deal value ₹${dealValue}`)
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get user's current active subscription
 */
export async function getUserSubscription(
  userId: string,
  supabaseClient?: SupabaseClient
) {
  const supabase = supabaseClient || getSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      pricing_plans (
        *
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()
  
  if (error) {
    return null
  }
  
  return data
}

/**
 * Check if user can perform an action based on their plan limits
 */
export async function canPerformAction(
  userId: string,
  actionType: 'create_property' | 'save_property' | 'create_lead' | 'add_team_member',
  supabaseClient?: SupabaseClient
): Promise<boolean> {
  const limitMap: Record<string, string> = {
    create_property: 'properties_per_project',
    save_property: 'saved_properties',
    create_lead: 'leads_per_month',
    add_team_member: 'team_members'
  }
  
  const limitType = limitMap[actionType]
  if (!limitType) return false
  
  const limitCheck = await checkFeatureLimit(userId, limitType, supabaseClient)
  return limitCheck.allowed
}

