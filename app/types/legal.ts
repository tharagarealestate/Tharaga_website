// Legal document types
export interface LegalDocument {
  id: string;
  document_type: 'privacy_policy' | 'terms_of_service' | 'refund_policy' | 'cookie_policy' | 'rera_compliance';
  version: string;
  content: LegalContent;
  effective_date: string;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface LegalContent {
  title: string;
  last_updated: string;
  sections: LegalSection[];
  metadata?: {
    word_count?: number;
    reading_time_minutes?: number;
    compliance_standards?: string[];
  };
}

export interface LegalSection {
  id: string;
  heading: string;
  content: string;
  subsections?: LegalSubsection[];
  order: number;
}

export interface LegalSubsection {
  id: string;
  heading: string;
  content: string;
  order: number;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: 'cookies' | 'privacy_policy' | 'terms_of_service' | 'marketing' | 'data_processing';
  consent_given: boolean;
  consent_timestamp: string;
  ip_address?: string;
  user_agent?: string;
  document_version?: string;
  withdrawn_at?: string;
  metadata?: Record<string, any>;
}

export interface RERAVerification {
  id: string;
  builder_id: string;
  rera_number: string;
  state: string;
  project_name?: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  verified_at?: string;
  expiry_date?: string;
  verification_document_url?: string;
  verification_notes?: string;
  auto_verify_confidence?: number;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
}

export interface CookieConsent {
  id: string;
  session_id: string;
  user_id?: string;
  essential_cookies: boolean;
  analytics_cookies: boolean;
  marketing_cookies: boolean;
  preference_cookies: boolean;
  consent_timestamp: string;
  ip_address?: string;
  user_agent?: string;
  updated_at: string;
}

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}




























