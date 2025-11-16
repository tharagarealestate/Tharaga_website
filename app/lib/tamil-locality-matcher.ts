/**
 * Tamil Locality Matcher
 * Fuzzy matching for Chennai micro-markets with Tamil/English variants
 */

// Chennai locality mappings (common variants and Tamil names)
export const CHENNAI_LOCALITIES: Record<string, string[]> = {
  'OMR': ['OMR', 'Old Mahabalipuram Road', 'ஓ எம் ஆர்', 'பழைய மகாபலிபுரம் சாலை', 'omr', 'old mahabalipuram'],
  'ECR': ['ECR', 'East Coast Road', 'ஈ சி ஆர்', 'கிழக்கு கடற்கரை சாலை', 'ecr', 'east coast'],
  'Velachery': ['Velachery', 'வேளச்சேரி', 'velachery', 'velacherry', 'velacheri'],
  'Porur': ['Porur', 'போரூர்', 'porur', 'poroor'],
  'Ambattur': ['Ambattur', 'அம்பத்தூர்', 'ambattur', 'ambathur'],
  'Pallavaram': ['Pallavaram', 'பல்லாவரம்', 'pallavaram', 'pallavaram', 'pallavaram'],
  'Chrompet': ['Chrompet', 'குரோம்பேட்', 'chrompet', 'chrompet', 'chrompet'],
  'Adyar': ['Adyar', 'அடையாறு', 'adyar', 'adiar'],
  'Anna Nagar': ['Anna Nagar', 'அண்ணா நகர்', 'anna nagar', 'annanagar', 'anna nagar'],
  'T. Nagar': ['T. Nagar', 'T Nagar', 'டி. நகர்', 't nagar', 't-nagar', 'tnagar'],
  'Mylapore': ['Mylapore', 'மைலாப்பூர்', 'mylapore', 'mylapor'],
  'Guindy': ['Guindy', 'கிண்டி', 'guindy', 'guindi'],
  'Medavakkam': ['Medavakkam', 'மேடவாக்கம்', 'medavakkam', 'medavakkam'],
  'Tambaram': ['Tambaram', 'தாம்பரம்', 'tambaram', 'tambaram'],
  'Perungudi': ['Perungudi', 'பெருங்குடி', 'perungudi', 'perungudi'],
  'Sholinganallur': ['Sholinganallur', 'சோழிங்கநல்லூர்', 'sholinganallur', 'sholinganallur', 'shollinganallur'],
  'Navallur': ['Navallur', 'நவலூர்', 'navallur', 'navallur'],
  'Karapakkam': ['Karapakkam', 'கரபாக்கம்', 'karapakkam', 'karapakkam'],
  'Thoraipakkam': ['Thoraipakkam', 'தொரைப்பாக்கம்', 'thoraipakkam', 'thoraipakkam'],
  'Siruseri': ['Siruseri', 'சீரூசேரி', 'siruseri', 'siruseri'],
  // Add more Chennai localities
}

/**
 * Normalize Tamil/English input for matching
 */
function normalizeInput(input: string): string {
  // Remove special characters, extra spaces
  let normalized = input.trim().toLowerCase()
  // Remove common prefixes/suffixes
  normalized = normalized.replace(/\b(the|a|an)\b/g, '')
  // Remove Tamil script markers (for transliteration)
  normalized = normalized.replace(/[^\w\s]/g, '')
  return normalized.trim()
}

/**
 * Calculate similarity score between two strings (Levenshtein distance based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeInput(str1)
  const s2 = normalizeInput(str2)
  
  // Exact match
  if (s1 === s2) return 1.0
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  
  // Levenshtein distance (simplified)
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  const editDistance = levenshteinDistance(s1, s2)
  const similarity = 1 - (editDistance / longer.length)
  
  return Math.max(0, similarity)
}

/**
 * Simple Levenshtein distance calculation
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        )
      }
    }
  }
  
  return matrix[len1][len2]
}

/**
 * Match input to Chennai localities with fuzzy matching
 * Returns top-2 matches with similarity scores
 */
export function matchChennaiLocality(
  input: string,
  limit: number = 2
): Array<{ canonical: string; variants: string[]; similarity: number }> {
  const normalizedInput = normalizeInput(input)
  
  const matches: Array<{ canonical: string; variants: string[]; similarity: number }> = []
  
  // Check each locality and its variants
  for (const [canonical, variants] of Object.entries(CHENNAI_LOCALITIES)) {
    let maxSimilarity = 0
    
    // Check against canonical name
    maxSimilarity = Math.max(maxSimilarity, calculateSimilarity(normalizedInput, canonical.toLowerCase()))
    
    // Check against all variants
    for (const variant of variants) {
      const similarity = calculateSimilarity(normalizedInput, variant.toLowerCase())
      maxSimilarity = Math.max(maxSimilarity, similarity)
    }
    
    if (maxSimilarity > 0.3) { // Threshold for fuzzy matching
      matches.push({
        canonical,
        variants,
        similarity: maxSimilarity,
      })
    }
  }
  
  // Sort by similarity (descending) and return top matches
  matches.sort((a, b) => b.similarity - a.similarity)
  return matches.slice(0, limit)
}

/**
 * Get canonical locality name from input
 */
export function getCanonicalLocality(input: string): string | null {
  const matches = matchChennaiLocality(input, 1)
  if (matches.length > 0 && matches[0].similarity > 0.7) {
    return matches[0].canonical
  }
  return null
}





