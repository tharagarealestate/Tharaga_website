export interface Property {
  id: string;
  builder_id: string;
  
  // Basic Info
  title: string;
  description?: string;
  property_type: 'apartment' | 'villa' | 'plot' | 'penthouse' | 'studio' | 'duplex';
  bhk_type?: '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK+';
  
  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  
  // Pricing
  base_price: number;
  price_per_sqft?: number;
  negotiable: boolean;
  maintenance_charges?: number;
  
  // Area
  carpet_area: number;
  built_up_area?: number;
  super_built_up_area?: number;
  plot_area?: number;
  
  // Details
  facing?: string;
  floor_number?: number;
  total_floors?: number;
  age_of_property?: number;
  furnishing_status?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  
  // Amenities
  amenities: string[];
  
  // Availability
  availability_status: 'available' | 'sold' | 'under-offer' | 'reserved';
  possession_status?: 'ready-to-move' | 'under-construction';
  possession_date?: string;
  
  // Legal
  rera_number?: string;
  rera_verified: boolean;
  approved_by_bank: boolean;
  clear_title: boolean;
  
  // Media
  thumbnail_url?: string;
  images: string[];
  videos: string[];
  floor_plans: string[];
  virtual_tour_url?: string;
  
  // AI Insights
  ai_price_estimate?: number;
  ai_appreciation_band?: 'low' | 'medium' | 'high';
  ai_rental_yield?: number;
  ai_risk_score?: number;
  ai_insights?: AIPropertyInsights;
  
  // Metrics
  view_count: number;
  inquiry_count: number;
  favorite_count: number;
  last_viewed_at?: string;
  
  // Admin
  verification_status: 'pending' | 'approved' | 'rejected';
  verification_notes?: string;
  verified_at?: string;
  verified_by?: string;
  
  // SEO
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  published_at?: string;
  expires_at?: string;
  
  // Relations (when populated)
  builder?: {
    id: string;
    company_name: string;
    logo_url?: string;
    verified: boolean;
  };
}

export interface AIPropertyInsights {
  price_analysis?: {
    market_comparison: 'below_market' | 'at_market' | 'above_market';
    comparable_properties: number;
    price_trend_6m: number; // percentage
    fair_value_estimate: number;
  };
  location_score?: {
    connectivity: number; // 0-10
    infrastructure: number;
    safety: number;
    environment: number;
    overall: number;
  };
  appreciation_forecast?: {
    year_1: number; // percentage
    year_3: number;
    year_5: number;
    confidence: number; // 0-1
  };
  risk_factors?: {
    legal: string[];
    financial: string[];
    location: string[];
    construction: string[];
  };
  neighborhood_insights?: {
    schools_within_2km: number;
    hospitals_within_5km: number;
    metro_distance_km: number;
    it_parks_within_10km: number;
    avg_rent_per_sqft: number;
  };
}

export interface PropertyFilter {
  city?: string;
  property_type?: string[];
  bhk_type?: string[];
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  possession_status?: string[];
  furnishing_status?: string[];
  amenities?: string[];
  facing?: string[];
  rera_verified?: boolean;
  availability_status?: string;
  search_query?: string;
}

export interface PropertyInquiry {
  id: string;
  property_id: string;
  buyer_id: string;
  builder_id: string;
  inquiry_type: 'general' | 'site_visit' | 'price_negotiation' | 'document_request';
  message: string;
  contact_preference: 'phone' | 'email' | 'whatsapp' | 'any';
  budget_range?: { min: number; max: number };
  visit_preferred_date?: string;
  visit_preferred_time?: string;
  status: 'new' | 'contacted' | 'visited' | 'negotiating' | 'closed' | 'lost';
  lead_score?: number;
  lead_quality?: 'hot' | 'warm' | 'cold';
  builder_response?: string;
  builder_responded_at?: string;
  created_at: string;
  updated_at: string;
}
