/**
 * Case-insensitive substring search over plain text. Returns the start offset
 * of every non-overlapping match — the engine behind find-in-output boxes.
 */

export function findMatches(text: string, query: string): number[] {
  const needle = query.toLowerCase();
  if (!needle) return [];
  const haystack = text.toLowerCase();
  const offsets: number[] = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) return offsets;
    offsets.push(at);
    from = at + needle.length;
  }
}
