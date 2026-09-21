/** Framework-free regex running + highlight segmentation. No DOM, no React. */

export interface RegexMatchView {
  index: number;
  text: string;
  groups: (string | undefined)[];
}

export function runRegex(
  pattern: string,
  flags: string,
  text: string,
): { matches: RegexMatchView[]; error: string | null } {
  if (!pattern) return { matches: [], error: null };
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
  } catch (error) {
    return { matches: [], error: error instanceof Error ? error.message : 'Invalid pattern.' };
  }
  const matches: RegexMatchView[] = [];
  let match: RegExpExecArray | null;
  let guard = 0;
  while ((match = regex.exec(text)) !== null) {
    matches.push({ index: match.index, text: match[0], groups: match.slice(1) });
    if (match[0] === '') regex.lastIndex += 1; // step over empty matches
    if (guard++ > 2000) break;
  }
  return { matches, error: null };
}

/** Build a pattern safely — returns null instead of throwing on bad input. */
export function tryRegex(pattern: string, flags: string): RegExp | null {
  try {
    return new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`);
  } catch {
    return null;
  }
}

/** Build highlight segments, skipping overlaps with earlier matches. */
export function highlightSegments(
  text: string,
  matches: RegexMatchView[],
): { text: string; hit: boolean }[] {
  const segments: { text: string; hit: boolean }[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.index < cursor) continue;
    if (match.index > cursor) segments.push({ text: text.slice(cursor, match.index), hit: false });
    segments.push({ text: match.text, hit: true });
    cursor = match.index + match.text.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), hit: false });
  return segments;
}
