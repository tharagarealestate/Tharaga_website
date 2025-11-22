-- =============================================
-- SECURE DOCUMENT ACCESS SYSTEM
-- Document storage, access control, and sharing
-- =============================================

-- Document storage and metadata
CREATE TABLE IF NOT EXISTS public.secure_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  document_type TEXT NOT NULL, -- 'floor_plan', 'brochure', 'legal_doc', 'noc', 'property_paper'
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  encrypted_url TEXT, -- Encrypted version for secure access
  mime_type TEXT NOT NULL,
  access_level TEXT DEFAULT 'verified', -- 'public', 'verified', 'high_score', 'premium'
  smartscore_required INTEGER DEFAULT 60,
  is_watermarked BOOLEAN DEFAULT false,
  watermark_text TEXT,
  expiry_date TIMESTAMPTZ,
  download_limit INTEGER DEFAULT 10,
  downloads_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_secure_docs_property ON public.secure_documents(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_secure_docs_type ON public.secure_documents(document_type, access_level);
CREATE INDEX IF NOT EXISTS idx_secure_docs_uploaded_by ON public.secure_documents(uploaded_by);

-- Document access logs (compliance & analytics)
CREATE TABLE IF NOT EXISTS public.document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.secure_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- 'view', 'download', 'share', 'preview'
  ip_address TEXT,
  user_agent TEXT,
  location_data JSONB, -- { country, city, lat, lng }
  access_granted BOOLEAN DEFAULT true,
  denial_reason TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_access_logs_doc ON public.document_access_logs(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_access_logs_user ON public.document_access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doc_access_logs_action ON public.document_access_logs(action, access_granted);

-- Document permissions (granular access control)
CREATE TABLE IF NOT EXISTS public.document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.secure_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  permission_type TEXT NOT NULL, -- 'view', 'download', 'share', 'full'
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_doc_permissions_doc ON public.document_permissions(document_id, user_id);
CREATE INDEX IF NOT EXISTS idx_doc_permissions_user ON public.document_permissions(user_id, is_active);

-- Document share links (temporary access)
CREATE TABLE IF NOT EXISTS public.document_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.secure_documents(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  share_token TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  max_views INTEGER DEFAULT 10,
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.document_share_links(share_token);
CREATE INDEX IF NOT EXISTS idx_share_links_doc ON public.document_share_links(document_id, is_active);

-- RLS Policies
ALTER TABLE public.secure_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_share_links ENABLE ROW LEVEL SECURITY;

-- Users can view documents they have permission for
DROP POLICY IF EXISTS "Users can view permitted documents" ON public.secure_documents;
CREATE POLICY "Users can view permitted documents" ON public.secure_documents
FOR SELECT
USING (
  auth.uid() = uploaded_by OR
  EXISTS (
    SELECT 1 FROM public.document_permissions
    WHERE document_id = secure_documents.id
    AND user_id = auth.uid()
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) OR
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE buyer_id = auth.uid()
    AND (smartscore_v2 >= secure_documents.smartscore_required OR ai_score >= secure_documents.smartscore_required)
  ) OR
  access_level = 'public'
);

-- Builders can insert their own documents
DROP POLICY IF EXISTS "Builders can insert documents" ON public.secure_documents;
CREATE POLICY "Builders can insert documents" ON public.secure_documents
FOR INSERT
WITH CHECK (
  auth.uid() = uploaded_by AND
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = property_id
    AND builder_id = auth.uid()
  )
);

-- Users can log their own access
DROP POLICY IF EXISTS "Users can log their own access" ON public.document_access_logs;
CREATE POLICY "Users can log their own access" ON public.document_access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own access logs
DROP POLICY IF EXISTS "Users can view their own logs" ON public.document_access_logs;
CREATE POLICY "Users can view their own logs" ON public.document_access_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Document permissions policies
DROP POLICY IF EXISTS "Users can view their permissions" ON public.document_permissions;
CREATE POLICY "Users can view their permissions" ON public.document_permissions
FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = granted_by);

-- Share links policies
DROP POLICY IF EXISTS "Users can view their share links" ON public.document_share_links;
CREATE POLICY "Users can view their share links" ON public.document_share_links
FOR SELECT
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create share links" ON public.document_share_links;
CREATE POLICY "Users can create share links" ON public.document_share_links
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.secure_documents
    WHERE id = document_id
    AND uploaded_by = auth.uid()
  )
);

-- Grant service role full access
GRANT ALL ON public.secure_documents TO service_role;
GRANT ALL ON public.document_access_logs TO service_role;
GRANT ALL ON public.document_permissions TO service_role;
GRANT ALL ON public.document_share_links TO service_role;

-- Access control function
CREATE OR REPLACE FUNCTION public.check_document_access(
  p_document_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_document RECORD;
  v_user_score INTEGER;
  v_has_permission BOOLEAN;
BEGIN
  -- Get document details
  SELECT * INTO v_document FROM public.secure_documents WHERE id = p_document_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if uploader
  IF v_document.uploaded_by = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check explicit permissions
  SELECT EXISTS (
    SELECT 1 FROM public.document_permissions
    WHERE document_id = p_document_id
    AND user_id = p_user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN TRUE;
  END IF;
  
  -- Check access level
  IF v_document.access_level = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Check SmartScore requirement
  SELECT COALESCE(MAX(COALESCE(smartscore_v2, ai_score, 0)), 0) INTO v_user_score
  FROM public.leads
  WHERE buyer_id = p_user_id;
  
  IF v_user_score >= v_document.smartscore_required THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.secure_documents IS 'Secure document storage with access control';
COMMENT ON TABLE public.document_access_logs IS 'Audit log for document access';
COMMENT ON TABLE public.document_permissions IS 'Granular document permissions';
COMMENT ON TABLE public.document_share_links IS 'Temporary share links for documents';

