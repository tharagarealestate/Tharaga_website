-- 20260427_metrics_cleanup.sql

-- 1. Create the aggregated RPC
CREATE OR REPLACE FUNCTION get_builder_dashboard_metrics(builder_id UUID)
RETURNS JSON AS $$
SELECT json_build_object(
  'active_leads', COUNT(DISTINCT l.id) FILTER (WHERE l.status IN ('new', 'contacted', 'qualified')),
  'pipeline_value', COALESCE(SUM(p.price_inr) FILTER (WHERE l.status = 'qualified'), 0),
  'lion_leads', COUNT(*) FILTER (WHERE l.smartscore >= 75),
  'conversion_rate', ROUND((COUNT(*) FILTER (WHERE l.status = 'converted')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 1)
)
FROM leads l
LEFT JOIN properties p ON l.property_id = p.id
WHERE l.builder_id = builder_id
  AND l.created_at >= NOW() - INTERVAL '30 days';
$$ LANGUAGE SQL;

-- 2. Cleanup fake leads
DELETE FROM leads 
WHERE name ILIKE '%test%' 
  OR name ILIKE '%debug%'
  OR email ILIKE '%test%';
