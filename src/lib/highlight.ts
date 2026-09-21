/** Tokenize pretty JSON into escaped HTML with spans. Input must be valid JSON. */
export function highlightJson(json: string): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const token = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  let out = '';
  let last = 0;
  for (const match of json.matchAll(token)) {
    const index = match.index ?? 0;
    out += escape(json.slice(last, index));
    if (match[1] !== undefined) {
      const cls = match[2] ? 'text-ink' : 'text-pencil';
      out += `<span class="${cls}">${escape(match[1])}</span>${match[2] ? escape(match[2]) : ''}`;
    } else if (match[3]) {
      out += `<span class="font-semibold">${escape(match[3])}</span>`;
    } else {
      out += `<span class="font-medium">${escape(match[0])}</span>`;
    }
    last = index + match[0].length;
  }
  return out + escape(json.slice(last));
}

/** Decode a base64url JWT segment to a UTF-8 string. */
export function decodeBase64Url(segment: string): string {
  const b64 = segment.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(segment.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
