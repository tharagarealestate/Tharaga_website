-- Legal Compliance System Migration
-- Creates tables for legal documents, user consents, RERA verifications, and cookie consents

-- Legal documents table
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_type TEXT NOT NULL CHECK (document_type IN ('privacy_policy', 'terms_of_service', 'refund_policy', 'cookie_policy', 'rera_compliance')),
    version TEXT NOT NULL,
    content JSONB NOT NULL,
    effective_date TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- User consent tracking
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    consent_type TEXT NOT NULL CHECK (consent_type IN ('cookies', 'privacy_policy', 'terms_of_service', 'marketing', 'data_processing')),
    consent_given BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    document_version TEXT,
    withdrawn_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, consent_type)
);

-- RERA verification records
CREATE TABLE IF NOT EXISTS rera_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    builder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rera_number TEXT UNIQUE NOT NULL,
    state TEXT NOT NULL,
    project_name TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
    verified_at TIMESTAMPTZ,
    expiry_date TIMESTAMPTZ,
    verification_document_url TEXT,
    verification_notes TEXT,
    auto_verify_confidence DECIMAL(3,2), -- AI confidence score 0-1
    last_checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cookie consent logs
CREATE TABLE IF NOT EXISTS cookie_consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    essential_cookies BOOLEAN DEFAULT true,
    analytics_cookies BOOLEAN DEFAULT false,
    marketing_cookies BOOLEAN DEFAULT false,
    preference_cookies BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_legal_docs_type_status ON legal_documents(document_type, status);
CREATE INDEX IF NOT EXISTS idx_user_consents_user_type ON user_consents(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_rera_builder_status ON rera_verifications(builder_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_session ON cookie_consents(session_id);

-- RLS Policies
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rera_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

-- Public can read active legal documents
DROP POLICY IF EXISTS "Anyone can read active legal documents" ON legal_documents;
CREATE POLICY "Anyone can read active legal documents"
    ON legal_documents FOR SELECT
    USING (status = 'active');

-- Users can view own consents
DROP POLICY IF EXISTS "Users can view own consents" ON user_consents;
CREATE POLICY "Users can view own consents"
    ON user_consents FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert own consents
DROP POLICY IF EXISTS "Users can insert own consents" ON user_consents;
CREATE POLICY "Users can insert own consents"
    ON user_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update own consents
DROP POLICY IF EXISTS "Users can update own consents" ON user_consents;
CREATE POLICY "Users can update own consents"
    ON user_consents FOR UPDATE
    USING (auth.uid() = user_id);

-- Builders can view own RERA verification
DROP POLICY IF EXISTS "Builders can view own RERA" ON rera_verifications;
CREATE POLICY "Builders can view own RERA"
    ON rera_verifications FOR SELECT
    USING (auth.uid() = builder_id);

-- Public can view verified RERA records
DROP POLICY IF EXISTS "Public can view verified RERA" ON rera_verifications;
CREATE POLICY "Public can view verified RERA"
    ON rera_verifications FOR SELECT
    USING (verification_status = 'verified');

-- Users can insert own cookie consents
DROP POLICY IF EXISTS "Users can insert own cookie consents" ON cookie_consents;
CREATE POLICY "Users can insert own cookie consents"
    ON cookie_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view own cookie consents
DROP POLICY IF EXISTS "Users can view own cookie consents" ON cookie_consents;
CREATE POLICY "Users can view own cookie consents"
    ON cookie_consents FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_legal_documents_updated_at ON legal_documents;
CREATE TRIGGER update_legal_documents_updated_at
    BEFORE UPDATE ON legal_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rera_verifications_updated_at ON rera_verifications;
CREATE TRIGGER update_rera_verifications_updated_at
    BEFORE UPDATE ON rera_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cookie_consents_updated_at ON cookie_consents;
CREATE TRIGGER update_cookie_consents_updated_at
    BEFORE UPDATE ON cookie_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();





