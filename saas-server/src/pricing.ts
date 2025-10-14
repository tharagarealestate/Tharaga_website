import type { Tier } from './config'

export type Entitlements = {
  tier: Tier
  listingLimit: number | null // null => unlimited
  monthlyLeadLimit: number | null
  features: Record<string, boolean>
}

export const TIERS: Record<Tier, Entitlements> = {
  free: {
    tier: 'free',
    listingLimit: 1,
    monthlyLeadLimit: 10,
    features: {
      emailFollowup: true,
      aiImageEnhance: false,
      aiSummary: false,
      aiVideo: false,
      microsite3D: false,
      emiCalc: false,
      autoLeadScore: false,
      whatsapp: false,
      calendarSync: false,
      analyticsBasic: false,
      analyticsAdvanced: false,
      workflowEditor: false,
      multiChannel: false,
      voiceTranscription: false,
      communityShare: false,
      prioritySupport: false
    }
  },
  growth: {
    tier: 'growth',
    listingLimit: 5,
    monthlyLeadLimit: 100,
    features: {
      emailFollowup: true,
      aiImageEnhance: true,
      aiSummary: true,
      aiVideo: false,
      microsite3D: true,
      emiCalc: true,
      autoLeadScore: true,
      whatsapp: true,
      calendarSync: true,
      analyticsBasic: true,
      analyticsAdvanced: false,
      workflowEditor: false,
      multiChannel: true, // WhatsApp + Email
      voiceTranscription: false,
      communityShare: false,
      prioritySupport: false
    }
  },
  pro: {
    tier: 'pro',
    listingLimit: null,
    monthlyLeadLimit: 500,
    features: {
      emailFollowup: true,
      aiImageEnhance: true,
      aiSummary: true,
      aiVideo: true,
      microsite3D: true,
      emiCalc: true,
      autoLeadScore: true,
      whatsapp: true,
      calendarSync: true,
      analyticsBasic: true,
      analyticsAdvanced: true,
      workflowEditor: true,
      multiChannel: true,
      voiceTranscription: true,
      communityShare: true,
      prioritySupport: true
    }
  },
  enterprise: {
    tier: 'enterprise',
    listingLimit: null,
    monthlyLeadLimit: null,
    features: {
      emailFollowup: true,
      aiImageEnhance: true,
      aiSummary: true,
      aiVideo: true,
      microsite3D: true,
      emiCalc: true,
      autoLeadScore: true,
      whatsapp: true,
      calendarSync: true,
      analyticsBasic: true,
      analyticsAdvanced: true,
      workflowEditor: true,
      multiChannel: true,
      voiceTranscription: true,
      communityShare: true,
      prioritySupport: true
    }
  }
}
