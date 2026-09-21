import { rgb, type Degrees, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

export const PAGE_SIZES = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  a5: [419.53, 595.28],
  legal: [612, 1008],
} as const;

export type PageSizeName = keyof typeof PAGE_SIZES;

/** Neutral drawing inks shared by the PDF generators. */
export const PDF_PALETTE = {
  ink: rgb(0.12, 0.13, 0.19),
  muted: rgb(0.44, 0.46, 0.55),
  faint: rgb(0.7, 0.72, 0.78),
  hairline: rgb(0.86, 0.87, 0.9),
} as const;

/*
 * Standard PDF fonts (Helvetica/Courier) are WinAnsi-encoded. Remap the symbols
 * they can't represent (₹, zł, …) and drop anything else outside WinAnsi, so
 * generation never throws on user input.
 */
const WIN_ANSI_REMAP: Record<string, string> = {
  '₹': 'Rs ',
  '₽': 'RUB ',
  '₺': 'TL ',
  '₴': 'UAH ',
  '₩': 'W ',
  '₪': 'ILS ',
  '₡': 'CRC ',
  'ł': 'l',
  'Ł': 'L',
  'ø': 'o',
  'Ø': 'O',
  'đ': 'd',
  'Đ': 'D',
  '−': '-',
};
// WinAnsi 0x80–0x9F range: € ‚ ƒ „ … † ‡ ˆ ‰ Š ‹ Œ Ž ' ' " " • – — ˜ ™ š › œ ž Ÿ
const WIN_ANSI_EXTRA = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';

export function winAnsi(text: string): string {
  let mapped = text;
  for (const [from, to] of Object.entries(WIN_ANSI_REMAP)) {
    mapped = mapped.split(from).join(to);
  }
  let out = '';
  for (const ch of mapped) {
    const code = ch.codePointAt(0) ?? 63;
    if (ch === '\n') out += ch;
    else if (ch === '\t') out += '  ';
    else if (code < 0x20 || code === 0x7f) out += ' ';
    else if (code <= 0xff || WIN_ANSI_EXTRA.includes(ch)) out += ch;
    else out += '?';
  }
  return out;
}

export interface DrawTextOptions {
  x: number;
  y: number;
  size: number;
  font: PDFFont;
  color?: RGB;
  opacity?: number;
  align?: 'left' | 'right' | 'center';
  rotate?: Degrees;
}

/** drawText with sanitizing + right/center alignment (x marks the anchor). */
export function drawText(page: PDFPage, text: string, o: DrawTextOptions): void {
  const clean = winAnsi(text);
  let x = o.x;
  if (o.align && o.align !== 'left') {
    const width = o.font.widthOfTextAtSize(clean, o.size);
    x = o.align === 'right' ? o.x - width : o.x - width / 2;
  }
  page.drawText(clean, {
    x,
    y: o.y,
    size: o.size,
    font: o.font,
    color: o.color ?? PDF_PALETTE.ink,
    opacity: o.opacity,
    rotate: o.rotate,
  });
}

export function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      // A single word longer than the column: hard-break it.
      let chunk = word;
      while (font.widthOfTextAtSize(chunk, size) > maxWidth && chunk.length > 1) {
        let cut = chunk.length - 1;
        while (cut > 1 && font.widthOfTextAtSize(chunk.slice(0, cut), size) > maxWidth) cut--;
        lines.push(chunk.slice(0, cut));
        chunk = chunk.slice(cut);
      }
      line = chunk;
    }
    if (line) lines.push(line);
  }
  return lines;
}

/** Draw wrapped text, returning the y baseline below the last line. */
export function drawWrapped(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  color: RGB,
  opacity?: number,
): number {
  for (const line of wrapText(text, font, size, maxWidth)) {
    if (line) drawText(page, line, { x, y, size, font, color, opacity });
    y -= lineHeight;
  }
  return y;
}

export function hexColor(hex: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return rgb(0.24, 0.27, 0.81);
  const int = parseInt(m[1]!, 16);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

export function drawDashed(
  page: PDFPage,
  start: { x: number; y: number },
  end: { x: number; y: number },
  opts: { dash?: number; gap?: number; thickness?: number; color?: RGB } = {},
): void {
  const { dash = 2, gap = 2.5, thickness = 0.7, color = PDF_PALETTE.faint } = opts;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return;
  const ux = dx / length;
  const uy = dy / length;
  let t = 0;
  while (t < length) {
    const segEnd = Math.min(t + dash, length);
    page.drawLine({
      start: { x: start.x + ux * t, y: start.y + uy * t },
      end: { x: start.x + ux * segEnd, y: start.y + uy * segEnd },
      thickness,
      color,
    });
    t = segEnd + gap;
  }
}

/** Deterministic PRNG so generated documents are reproducible from their inputs. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
