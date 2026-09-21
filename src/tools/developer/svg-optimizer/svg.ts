/**
 * Framework-free SVG cleaning + preview sanitizing. No DOM, no React.
 *
 * cleanSvg shrinks markup (comments, editor cruft, hidden/empty elements,
 * long decimals). sanitizeSvgPreview additionally strips active content —
 * scripts, event handlers, javascript: URLs — before user-supplied SVG is
 * rendered into the page preview. The tool only ever shows the user their own
 * file back, but a preview must not execute it.
 */

export function cleanSvg(source: string): { text: string; removed: string[] } {
  const removed: string[] = [];
  let svg = source;

  const before = svg.length;
  svg = svg.replace(/<!--[\s\S]*?-->/g, '');
  if (svg.length !== before) removed.push('comments');

  for (const tag of ['metadata', 'desc']) {
    const re = new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, 'gi');
    if (re.test(svg)) {
      svg = svg.replace(re, '');
      removed.push(`<${tag}>`);
    }
  }

  const editorAttrs = /(\s(inkscape|sodipodi|sketch|figma|illustrator)[a-z:.-]+="[^"]*")/gi;
  if (editorAttrs.test(svg)) {
    svg = svg.replace(editorAttrs, '');
    removed.push('editor attributes');
  }

  const hidden = /<[a-z]+[^>]*\sdisplay\s*=\s*"none"[^>]*\/?>(?:[\s\S]*?<\/[a-z]+>)?/gi;
  if (hidden.test(svg)) {
    svg = svg.replace(hidden, '');
    removed.push('hidden elements');
  }

  const emptyGroups = /<g(\s[^>]*)?>\s*<\/g>/gi;
  if (emptyGroups.test(svg)) {
    svg = svg.replace(emptyGroups, '');
    removed.push('empty groups');
  }

  svg = svg.replace(/(\d+\.\d{3})\d+/g, (match) => String(parseFloat(match))); // round decimals
  svg = svg.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();

  return { text: svg, removed };
}

/** Strip active content from user-supplied SVG before injecting it into the preview. */
export function sanitizeSvgPreview(source: string): string {
  let out = source;
  out = out.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  out = out.replace(/<(foreignObject|iframe|object|embed|audio|video)[\s\S]*?<\/\1\s*>/gi, '');
  out = out.replace(/<(foreignObject|iframe|object|embed|audio|video)[^>]*\/?>/gi, '');
  // Event-handler attributes (onload, onclick, …), quoted or unquoted.
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // javascript:/data:text/html URLs in hrefs.
  out = out.replace(/\s(xlink:)?href\s*=\s*("|\s*)(javascript|data:text\/html)[\s\S]*?\2/gi, ' href="#"');
  return out;
}
