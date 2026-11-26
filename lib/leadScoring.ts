// Lead scoring algorithm based on message content
export function calculateLeadScore(message: string): { score: number; label: 'high' | 'medium' | 'low' } {
  const m = message.toLowerCase();
  const signals = [
    [/ready|finali[sz]e|this week|book(ing)?/g, 0.85, 'high'],
    [/loan|emi|visit|site|tour/g, 0.65, 'medium'],
    [/info|details|more|interested/g, 0.45, 'medium'],
  ] as const;

  let best = { score: 0.35, label: 'low' as 'low' | 'medium' | 'high' };
  for (const [re, sc, lab] of signals) {
    if (re.test(m)) {
      best = { score: Math.max(best.score, sc), label: lab };
    }
  }

  return best;
}
