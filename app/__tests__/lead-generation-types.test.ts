import { describe, expect, test } from 'vitest'
import type {
  UserBehavior,
  LeadScore,
  LeadInteraction,
  LeadSource,
  LeadPipeline,
  BuilderMetrics,
  MarketingCampaign,
  BuyerPreferences,
  AIRecommendation,
  EnrichedLead,
  LeadAnalytics,
  CalculateScoreResponse,
  GetLeadsResponse,
  CreateInteractionResponse,
  ScoreBadge,
  FilterOption,
  SortOption,
} from '@/types/lead-generation'
import {
  isRecommendationExpired,
  getScoreBadge,
  getStageBadge,
} from '@/types/lead-generation'

describe('Lead Generation Types', () => {
  describe('UserBehavior', () => {
    test('should have correct type structure', () => {
      const behavior: UserBehavior = {
        id: '123',
        user_id: 'user-123',
        behavior_type: 'property_view',
        property_id: 'prop-123',
        timestamp: '2024-01-01T00:00:00Z',
        duration: 120,
        metadata: { page: 'property-detail' },
        session_id: 'session-123',
        device_type: 'mobile',
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(behavior.behavior_type).toBe('property_view')
      expect(behavior.duration).toBe(120)
      expect(behavior.device_type).toBe('mobile')
    })

    test('should allow null values for optional fields', () => {
      const behavior: UserBehavior = {
        id: '123',
        user_id: 'user-123',
        behavior_type: 'search',
        property_id: null,
        timestamp: '2024-01-01T00:00:00Z',
        duration: 0,
        metadata: {},
        session_id: null,
        device_type: null,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(behavior.property_id).toBeNull()
      expect(behavior.session_id).toBeNull()
      expect(behavior.device_type).toBeNull()
    })
  })

  describe('LeadScore', () => {
    test('should have correct type structure', () => {
      const score: LeadScore = {
        id: '123',
        user_id: 'user-123',
        score: 8.5,
        category: 'Hot Lead',
        budget_alignment_score: 9.0,
        engagement_score: 8.0,
        property_fit_score: 7.5,
        time_investment_score: 9.0,
        contact_intent_score: 8.5,
        recency_score: 9.5,
        last_calculated: '2024-01-01T00:00:00Z',
        calculation_count: 5,
        score_history: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(score.score).toBe(8.5)
      expect(score.category).toBe('Hot Lead')
      expect(score.score_history).toEqual([])
    })
  })

  describe('LeadInteraction', () => {
    test('should have correct type structure', () => {
      const interaction: LeadInteraction = {
        id: '123',
        lead_id: 'lead-123',
        builder_id: 'builder-123',
        property_id: 'prop-123',
        interaction_type: 'phone_call',
        timestamp: '2024-01-01T00:00:00Z',
        response_time_minutes: 15,
        scheduled_for: null,
        completed_at: '2024-01-01T00:15:00Z',
        status: 'completed',
        notes: 'Interested in property',
        outcome: 'Interested',
        next_follow_up: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:15:00Z',
      }

      expect(interaction.interaction_type).toBe('phone_call')
      expect(interaction.status).toBe('completed')
      expect(interaction.response_time_minutes).toBe(15)
    })
  })

  describe('LeadPipeline', () => {
    test('should have correct type structure', () => {
      const pipeline: LeadPipeline = {
        id: '123',
        lead_id: 'lead-123',
        builder_id: 'builder-123',
        property_id: 'prop-123',
        stage: 'negotiation',
        stage_history: [
          {
            stage: 'new',
            entered_at: '2024-01-01T00:00:00Z',
            exited_at: '2024-01-02T00:00:00Z',
            duration_hours: 24,
          },
        ],
        expected_close_date: '2024-01-15',
        close_probability: 75,
        deal_value: 5000000,
        commission_value: 50000,
        lost_reason: null,
        lost_at: null,
        competitor_name: null,
        last_contact_date: '2024-01-05T00:00:00Z',
        contact_count: 3,
        days_in_pipeline: 5,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      }

      expect(pipeline.stage).toBe('negotiation')
      expect(pipeline.close_probability).toBe(75)
      expect(pipeline.stage_history).toHaveLength(1)
    })
  })

  describe('BuilderMetrics', () => {
    test('should have correct type structure', () => {
      const metrics: BuilderMetrics = {
        id: '123',
        builder_id: 'builder-123',
        avg_first_response_minutes: 30,
        avg_overall_response_minutes: 45,
        fastest_response_minutes: 5,
        slowest_response_minutes: 120,
        total_leads_received: 100,
        total_leads_contacted: 80,
        total_leads_qualified: 50,
        total_leads_converted: 20,
        total_leads_lost: 10,
        contact_rate: 80.0,
        qualification_rate: 62.5,
        conversion_rate: 40.0,
        overall_conversion_rate: 20.0,
        total_revenue: 100000000,
        total_commission: 1000000,
        avg_deal_size: 5000000,
        avg_follow_ups_per_lead: 2.5,
        avg_days_to_close: 45.5,
        avg_lead_score_received: 7.5,
        avg_lead_score_converted: 8.5,
        last_calculated: '2024-01-01T00:00:00Z',
        calculation_period_start: '2024-01-01T00:00:00Z',
        calculation_period_end: '2024-01-31T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(metrics.overall_conversion_rate).toBe(20.0)
      expect(metrics.total_leads_received).toBe(100)
    })
  })

  describe('MarketingCampaign', () => {
    test('should have correct type structure', () => {
      const campaign: MarketingCampaign = {
        id: '123',
        campaign_name: 'Summer Sale',
        utm_campaign: 'summer-sale-2024',
        campaign_type: 'paid_search',
        platform: 'google_ads',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        is_active: true,
        status: 'active',
        budget_total: 100000,
        budget_daily: 5000,
        spent_total: 50000,
        impressions: 1000000,
        clicks: 10000,
        leads_generated: 500,
        qualified_leads: 200,
        conversions: 50,
        revenue_generated: 25000000,
        commission_earned: 250000,
        ctr: 1.0,
        cpc: 5.0,
        cpl: 100.0,
        cpa: 1000.0,
        roi: 24900.0,
        roas: 500.0,
        target_audience: { age: '25-45', interests: ['real estate'] },
        target_locations: ['Mumbai', 'Delhi'],
        notes: 'High performing campaign',
        created_by: 'admin-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(campaign.campaign_type).toBe('paid_search')
      expect(campaign.roi).toBe(24900.0)
      expect(campaign.roas).toBe(500.0)
    })
  })

  describe('BuyerPreferences', () => {
    test('should have correct type structure', () => {
      const preferences: BuyerPreferences = {
        id: '123',
        user_id: 'user-123',
        preferred_cities: ['Mumbai', 'Pune'],
        preferred_localities: ['Andheri', 'Bandra'],
        preferred_areas: ['Andheri West'],
        avoid_areas: ['Andheri East'],
        budget_min: 5000000,
        budget_max: 10000000,
        budget_flexibility: 10.0,
        payment_type: 'loan',
        loan_approved: true,
        property_types: ['apartment', 'villa'],
        bhk_types: ['2BHK', '3BHK'],
        carpet_area_min: 1000,
        carpet_area_max: 2000,
        must_have_amenities: ['parking', 'gym'],
        preferred_amenities: { 'swimming_pool': 8, 'garden': 7 },
        property_purpose: 'self_use',
        lifestyle_tags: ['family_oriented'],
        office_location: { lat: 19.0760, lng: 72.8777, address: 'Mumbai' },
        max_commute_minutes: 30,
        commute_modes: ['car', 'metro'],
        priority_location: 9,
        priority_price: 8,
        priority_amenities: 7,
        priority_builder_reputation: 8,
        priority_ready_to_move: 6,
        construction_status: 'ready_to_move',
        property_age_max_years: 5,
        floor_preference: ['middle', 'high'],
        facing_preference: ['east', 'north'],
        last_updated: '2024-01-01T00:00:00Z',
        preference_completeness: 85,
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(preferences.preferred_cities).toContain('Mumbai')
      expect(preferences.budget_min).toBe(5000000)
      expect(preferences.priority_location).toBe(9)
    })
  })

  describe('AIRecommendation', () => {
    test('should have correct type structure', () => {
      const recommendation: AIRecommendation = {
        id: '123',
        user_id: 'user-123',
        property_id: 'prop-123',
        match_score: 8.5,
        location_match_score: 9.0,
        price_match_score: 8.0,
        amenities_match_score: 7.5,
        specification_match_score: 8.5,
        lifestyle_match_score: 9.0,
        commute_match_score: 8.0,
        match_explanation: 'Great match for your preferences',
        match_highlights: ['Perfect location', 'Within budget'],
        match_concerns: ['Slightly over budget'],
        recommendation_reason: 'high_match',
        confidence_level: 'high',
        shown_at: '2024-01-01T00:00:00Z',
        shown_count: 3,
        clicked: true,
        clicked_at: '2024-01-01T00:05:00Z',
        saved: false,
        saved_at: null,
        contacted_builder: false,
        contacted_at: null,
        user_feedback: 'good',
        feedback_reason: 'Location is good',
        expires_at: '2024-01-31T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:05:00Z',
      }

      expect(recommendation.match_score).toBe(8.5)
      expect(recommendation.confidence_level).toBe('high')
      expect(recommendation.match_highlights).toContain('Perfect location')
    })
  })

  describe('EnrichedLead', () => {
    test('should extend LeadPipeline with additional data', () => {
      const enrichedLead: EnrichedLead = {
        id: '123',
        lead_id: 'lead-123',
        builder_id: 'builder-123',
        property_id: 'prop-123',
        stage: 'contacted',
        stage_history: [],
        expected_close_date: null,
        close_probability: null,
        deal_value: null,
        commission_value: null,
        lost_reason: null,
        lost_at: null,
        competitor_name: null,
        last_contact_date: null,
        contact_count: 0,
        days_in_pipeline: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        lead: {
          id: 'lead-123',
          email: 'lead@example.com',
          phone: '+919876543210',
          full_name: 'John Doe',
          location: 'Mumbai',
        },
        property: {
          id: 'prop-123',
          title: 'Luxury Apartment',
          price: 5000000,
          images: ['image1.jpg'],
          location: 'Andheri, Mumbai',
          bhk_type: '2BHK',
        },
        lead_score: null,
        lead_source: null,
        interactions: [],
      }

      expect(enrichedLead.lead.email).toBe('lead@example.com')
      expect(enrichedLead.property.title).toBe('Luxury Apartment')
    })
  })

  describe('Helper Functions', () => {
    test('isRecommendationExpired should return true for expired recommendations', () => {
      const expired: AIRecommendation = {
        id: '123',
        user_id: 'user-123',
        property_id: 'prop-123',
        match_score: 8.0,
        location_match_score: 8.0,
        price_match_score: 8.0,
        amenities_match_score: 8.0,
        specification_match_score: 8.0,
        lifestyle_match_score: 8.0,
        commute_match_score: 8.0,
        match_explanation: null,
        match_highlights: [],
        match_concerns: [],
        recommendation_reason: null,
        confidence_level: null,
        shown_at: null,
        shown_count: 0,
        clicked: false,
        clicked_at: null,
        saved: false,
        saved_at: null,
        contacted_builder: false,
        contacted_at: null,
        user_feedback: null,
        feedback_reason: null,
        expires_at: '2020-01-01T00:00:00Z', // Past date
        created_at: '2020-01-01T00:00:00Z',
        updated_at: '2020-01-01T00:00:00Z',
      }

      expect(isRecommendationExpired(expired)).toBe(true)
    })

    test('isRecommendationExpired should return false for active recommendations', () => {
      const active: AIRecommendation = {
        id: '123',
        user_id: 'user-123',
        property_id: 'prop-123',
        match_score: 8.0,
        location_match_score: 8.0,
        price_match_score: 8.0,
        amenities_match_score: 8.0,
        specification_match_score: 8.0,
        lifestyle_match_score: 8.0,
        commute_match_score: 8.0,
        match_explanation: null,
        match_highlights: [],
        match_concerns: [],
        recommendation_reason: null,
        confidence_level: null,
        shown_at: null,
        shown_count: 0,
        clicked: false,
        clicked_at: null,
        saved: false,
        saved_at: null,
        contacted_builder: false,
        contacted_at: null,
        user_feedback: null,
        feedback_reason: null,
        expires_at: '2099-12-31T00:00:00Z', // Future date
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      expect(isRecommendationExpired(active)).toBe(false)
    })

    test('getScoreBadge should return correct badge for Hot Lead', () => {
      const badge = getScoreBadge('Hot Lead')
      expect(badge.emoji).toBe('🔥')
      expect(badge.text).toBe('Hot Lead')
      expect(badge.color).toBe('text-red-600')
      expect(badge.bgColor).toBe('bg-red-50')
    })

    test('getScoreBadge should return correct badge for all categories', () => {
      const categories: LeadScore['category'][] = [
        'Hot Lead',
        'Warm Lead',
        'Developing Lead',
        'Cold Lead',
        'Low Quality',
      ]

      categories.forEach((category) => {
        const badge = getScoreBadge(category)
        expect(badge).toHaveProperty('emoji')
        expect(badge).toHaveProperty('text')
        expect(badge).toHaveProperty('color')
        expect(badge).toHaveProperty('bgColor')
      })
    })

    test('getStageBadge should return correct badge for all stages', () => {
      const stages: LeadPipeline['stage'][] = [
        'new',
        'contacted',
        'qualified',
        'site_visit_scheduled',
        'site_visit_completed',
        'negotiation',
        'offer_made',
        'offer_accepted',
        'documentation',
        'closed_won',
        'closed_lost',
      ]

      stages.forEach((stage) => {
        const badge = getStageBadge(stage)
        expect(badge).toHaveProperty('label')
        expect(badge).toHaveProperty('color')
      })

      expect(getStageBadge('closed_won').label).toBe('Closed Won')
      expect(getStageBadge('closed_lost').label).toBe('Closed Lost')
    })
  })

  describe('API Response Types', () => {
    test('CalculateScoreResponse should have correct structure', () => {
      const response: CalculateScoreResponse = {
        success: true,
        score: 8.5,
        category: 'Hot Lead',
        breakdown: {
          budget_alignment: 9.0,
          engagement: 8.0,
          property_fit: 7.5,
          time_investment: 9.0,
          contact_intent: 8.5,
          recency: 9.5,
        },
        message: 'Lead score calculated successfully',
      }

      expect(response.success).toBe(true)
      expect(response.score).toBe(8.5)
      expect(response.breakdown.budget_alignment).toBe(9.0)
    })

    test('GetLeadsResponse should have correct structure', () => {
      const response: GetLeadsResponse = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0,
        },
        analytics: {
          total_leads: 0,
          hot_leads: 0,
          warm_leads: 0,
          developing_leads: 0,
          cold_leads: 0,
          avg_score: 0,
          conversion_rate: 0,
          source_breakdown: [],
        },
      }

      expect(response.success).toBe(true)
      expect(response.pagination.page).toBe(1)
      expect(response.analytics.total_leads).toBe(0)
    })

    test('CreateInteractionResponse should have correct structure', () => {
      const response: CreateInteractionResponse = {
        success: true,
        data: {
          id: '123',
          lead_id: 'lead-123',
          builder_id: 'builder-123',
          property_id: 'prop-123',
          interaction_type: 'phone_call',
          timestamp: '2024-01-01T00:00:00Z',
          response_time_minutes: null,
          scheduled_for: null,
          completed_at: null,
          status: 'pending',
          notes: null,
          outcome: null,
          next_follow_up: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        message: 'Interaction created successfully',
      }

      expect(response.success).toBe(true)
      expect(response.data.interaction_type).toBe('phone_call')
    })
  })
})

