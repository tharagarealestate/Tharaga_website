-- ===========================================
-- Migration: 073_ai_documentation_assistant.sql
-- AI-Powered Documentation Assistant System
-- RAG (Retrieval Augmented Generation) with Vector Embeddings
-- ===========================================

BEGIN;

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- ===========================================
-- 1. ADD EMBEDDING COLUMN TO FEATURE_DOCUMENTATION
-- ===========================================

-- Add embedding column for vector search (1536 dimensions for OpenAI text-embedding-3-small)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feature_documentation' 
    AND column_name = 'embedding'
  ) THEN
    ALTER TABLE public.feature_documentation 
    ADD COLUMN embedding vector(1536);
  END IF;
END $$;

-- Create vector index for similarity search
CREATE INDEX IF NOT EXISTS idx_feature_documentation_embedding 
ON public.feature_documentation 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add column to track if embedding needs generation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feature_documentation' 
    AND column_name = 'needs_embedding'
  ) THEN
    ALTER TABLE public.feature_documentation 
    ADD COLUMN needs_embedding BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ===========================================
-- 2. AI DOCUMENTATION CONVERSATIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.ai_documentation_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  context_feature_key TEXT REFERENCES public.feature_documentation(feature_key) ON DELETE SET NULL,
  context_page_url TEXT,
  context_user_role TEXT,
  context_user_tier TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- messages structure: [{role: 'user'|'assistant'|'system', content: string, timestamp: string}]
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_doc_conversations_user ON public.ai_documentation_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_doc_conversations_session ON public.ai_documentation_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_doc_conversations_context ON public.ai_documentation_conversations(context_feature_key);
CREATE INDEX IF NOT EXISTS idx_ai_doc_conversations_updated ON public.ai_documentation_conversations(updated_at DESC);

-- Update trigger
CREATE OR REPLACE FUNCTION update_ai_doc_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ai_doc_conversations_updated_at ON public.ai_documentation_conversations;
CREATE TRIGGER trigger_update_ai_doc_conversations_updated_at
  BEFORE UPDATE ON public.ai_documentation_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_doc_conversations_updated_at();

-- ===========================================
-- 3. AI FEATURE RECOMMENDATIONS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.ai_feature_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommended_feature_key TEXT NOT NULL REFERENCES public.feature_documentation(feature_key) ON DELETE CASCADE,
  recommendation_reason TEXT NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  recommendation_source TEXT, -- 'behavior_analysis', 'feature_usage', 'user_similarity', 'ml_model'
  source_data JSONB DEFAULT '{}'::jsonb,
  shown_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recommended_feature_key, DATE(created_at))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON public.ai_feature_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_feature ON public.ai_feature_recommendations(recommended_feature_key);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_confidence ON public.ai_feature_recommendations(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_clicked ON public.ai_feature_recommendations(clicked) WHERE clicked = false;

-- ===========================================
-- 4. VECTOR SIMILARITY SEARCH FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.search_feature_documentation_embeddings(
  query_embedding vector(1536),
  match_threshold NUMERIC DEFAULT 0.7,
  match_count INTEGER DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_tier TEXT DEFAULT NULL
)
RETURNS TABLE (
  feature_key TEXT,
  feature_name TEXT,
  category TEXT,
  short_description TEXT,
  similarity NUMERIC,
  tier_required TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fd.feature_key,
    fd.feature_name,
    fd.category,
    fd.short_description,
    1 - (fd.embedding <=> query_embedding) AS similarity,
    fd.tier_required
  FROM public.feature_documentation fd
  WHERE fd.embedding IS NOT NULL
    AND 1 - (fd.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR fd.category = filter_category)
    AND (filter_tier IS NULL OR fd.tier_required = filter_tier)
  ORDER BY fd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ===========================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ===========================================

-- Enable RLS
ALTER TABLE public.ai_documentation_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feature_recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own conversations
CREATE POLICY "users_own_conversations"
  ON public.ai_documentation_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own recommendations
CREATE POLICY "users_own_recommendations"
  ON public.ai_feature_recommendations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "service_role_ai_conversations_full"
  ON public.ai_documentation_conversations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_ai_recommendations_full"
  ON public.ai_feature_recommendations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Comments
COMMENT ON TABLE public.ai_documentation_conversations IS 'Stores AI chat conversations for documentation assistant with context awareness';
COMMENT ON TABLE public.ai_feature_recommendations IS 'ML-powered feature recommendations based on user behavior and patterns';
COMMENT ON FUNCTION public.search_feature_documentation_embeddings IS 'Vector similarity search for feature documentation using embeddings';

COMMIT;




