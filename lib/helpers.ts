// Helper functions from LeadCard component
export function getScoreColor(score: number): string {
  if (score >= 9) return '#D4AF37'; // Gold - Hot
  if (score >= 7) return '#F59E0B'; // Orange - Warm
  if (score >= 5) return '#3B82F6'; // Blue - Developing
  if (score >= 3) return '#6B7280'; // Gray - Cold
  return '#9CA3AF'; // Light gray - Low
}

export function getScoreLabel(score: number): string {
  if (score >= 9) return '🔥 Hot';
  if (score >= 7) return '⚡ Warm';
  if (score >= 5) return '📈 Developing';
  if (score >= 3) return '❄️ Cold';
  return '⏸️ Low';
}

export function formatCurrency(n: number): string {
  try {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}
