-- AI Tools: calculation results storage
-- Used by /api/tools/roi, /api/tools/emi, /api/tools/budget,
--           /api/tools/loan, /api/tools/locality, /api/tools/valuation

CREATE TABLE IF NOT EXISTS tool_calculations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tool       text        NOT NULL,       -- 'roi' | 'emi' | 'budget' | 'loan' | 'locality' | 'valuation'
  input      jsonb,
  result     jsonb,
  user_id    uuid,
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tool_calculations_tool
  ON tool_calculations(tool, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_calculations_user
  ON tool_calculations(user_id)
  WHERE user_id IS NOT NULL;

-- No RLS: calculation results contain no PII; inputs are financial figures only.
-- If user_id is added later, enable RLS and add policy:
-- ALTER TABLE tool_calculations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "users_own_calcs" ON tool_calculations FOR ALL USING (user_id = auth.uid());
