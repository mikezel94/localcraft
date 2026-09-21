const SEPARATORS = /[\s\-_/.,:;]+/;

/**
 * Score `needle` as an in-order character run of `hay` (lowercase). Higher is
 * better; 0 means no match. Substrings dominate; scattered matches score low.
 */
function subsequenceScore(needle: string, hay: string): number {
  const at = hay.indexOf(needle);
  if (at !== -1) {
    let score = 160 + Math.max(0, 30 - at);
    if (at === 0 || hay[at - 1] === ' ') score += 40;
    return score;
  }

  let score = 0;
  let cursor = 0;
  let prev = -1;
  for (let i = 0; i < needle.length; i++) {
    const found = hay.indexOf(needle[i]!, cursor);
    if (found === -1) return 0;
    score += 6;
    if (found === 0 || hay[found - 1] === ' ') score += 10;
    if (prev !== -1 && found === prev + 1) score += 5;
    else if (prev !== -1) score -= Math.min(6, found - prev - 1) * 0.5;
    prev = found;
    cursor = found + 1;
  }
  return score;
}

export interface SearchableTool {
  name: string;
  keywords: string[];
  blurb: string;
}

/**
 * Multi-token tool score: every token ("qr gen") must match. Tokens may
 * subsequence-match the short tool name ("rcipt" → "Receipt …"), or appear as
 * plain substrings of a keyword or the blurb. Long-text subsequence matching is
 * deliberately avoided — it matches everything.
 */
export function fuzzyToolScore(query: string, entry: SearchableTool): number {
  const tokens = query.toLowerCase().trim().split(SEPARATORS).filter(Boolean);
  if (tokens.length === 0) return 1;

  const name = entry.name.toLowerCase().replace(SEPARATORS, ' ');
  let total = 0;
  for (const token of tokens) {
    const viaName = subsequenceScore(token, name);
    const viaKeyword = entry.keywords.some((k) => k.toLowerCase().includes(token)) ? 130 : 0;
    const viaBlurb = entry.blurb.toLowerCase().includes(token) ? 100 : 0;
    const score = Math.max(viaName, viaKeyword, viaBlurb);
    if (score <= 0) return 0;
    total += score;
  }
  return total / tokens.length;
}
