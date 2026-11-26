-- =============================================
-- FUNCTION: Get SmartScore Trends
-- Used by analytics API
-- =============================================

CREATE OR REPLACE FUNCTION get_score_trends(
  p_builder_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  date TEXT,
  avg_score DECIMAL(5,2),
  hot_leads INTEGER,
  warm_leads INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_scores AS (
    SELECT 
      DATE(l.created_at) as score_date,
      AVG(l.smartscore_v2) as avg_score,
      COUNT(CASE WHEN l.priority_tier = 'platinum' OR (l.priority_tier = 'gold' AND l.smartscore_v2 >= 80) THEN 1 END) as hot_count,
      COUNT(CASE WHEN l.priority_tier IN ('gold', 'silver') THEN 1 END) as warm_count
    FROM leads l
    WHERE l.builder_id = p_builder_id
      AND l.created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND l.smartscore_v2 IS NOT NULL
    GROUP BY DATE(l.created_at)
    ORDER BY DATE(l.created_at)
  )
  SELECT 
    TO_CHAR(score_date, 'Mon DD') as date,
    ROUND(avg_score, 2) as avg_score,
    hot_count::INTEGER as hot_leads,
    warm_count::INTEGER as warm_leads
  FROM daily_scores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON FUNCTION get_score_trends(UUID, INTEGER) IS 'Get daily SmartScore trends for a builder over a specified period';

