import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';

import { drawText, drawWrapped, hexColor, mulberry32, PAGE_SIZES, PDF_PALETTE, winAnsi, type PageSizeName } from '@/lib/pdf';

export interface PlaceholderSpec {
  pageCount: number;
  pageSize: PageSizeName;
  landscape: boolean;
  contentStyle: 'lorem' | 'wireframe';
  title: string;
  footer: string;
  pageNumbers: boolean;
  watermark: string;
  accentHex: string;
}

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt, neque porro quisquam est qui dolorem ipsum quia dolor sit amet.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa.',
  'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est.',
  'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus.',
];

function drawWireframe(
  page: PDFPage,
  rng: () => number,
  x: number,
  yTop: number,
  width: number,
  yFloor: number,
  blockColor: RGB,
  lineColor: RGB,
  accent: RGB,
): void {
  let y = yTop;
  // Masthead bar
  page.drawRectangle({ x, y: y - 16, width: width * 0.34, height: 16, color: accent, opacity: 0.9 });
  y -= 36;
  // Hero block
  const heroH = Math.min(110, y - yFloor - 70);
  if (heroH > 40) {
    page.drawRectangle({ x, y: y - heroH, width, height: heroH, color: blockColor });
    y -= heroH + 18;
  }
  // Card grid with placeholder text lines
  while (y - 70 > yFloor) {
    const cols = rng() > 0.5 ? 2 : 3;
    const gap = 12;
    const cardW = (width - gap * (cols - 1)) / cols;
    const cardH = 62 + Math.floor(rng() * 28);
    for (let c = 0; c < cols; c++) {
      const cx = x + c * (cardW + gap);
      page.drawRectangle({ x: cx, y: y - cardH, width: cardW, height: cardH, color: blockColor });
      let lineY = y - cardH + 16;
      for (let l = 0; l < 3 && lineY > y - cardH + 10; l++) {
        page.drawRectangle({
          x: cx + 8,
          y: lineY,
          width: (cardW - 16) * (0.45 + rng() * 0.45),
          height: 3,
          color: lineColor,
        });
        lineY -= 9;
      }
    }
    y -= cardH + 16;
  }
}

function drawWatermark(page: PDFPage, text: string, pageW: number, pageH: number, font: PDFFont): void {
  const size = Math.min(72, (pageW * 0.9) / (Math.max(4, text.length) * 0.55));
  const clean = winAnsi(text);
  page.drawText(clean, {
    x: pageW / 2 - font.widthOfTextAtSize(clean, size) * 0.35,
    y: pageH / 2 - size * 0.5,
    size,
    font,
    color: rgb(0.45, 0.47, 0.55),
    opacity: 0.08,
    rotate: degrees(45),
  });
}

export async function buildPlaceholderPdf(spec: PlaceholderSpec): Promise<Uint8Array> {
  const count = Math.max(1, Math.min(100, Math.floor(spec.pageCount) || 1));
  const [pw, ph] = PAGE_SIZES[spec.pageSize];
  const pageW = spec.landscape ? ph : pw;
  const pageH = spec.landscape ? pw : ph;

  const doc = await PDFDocument.create();
  doc.setTitle(winAnsi(spec.title || 'Untitled document'));
  doc.setProducer('LocalCraft (client-side)');

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const accent = hexColor(spec.accentHex);
  const { ink, muted, faint } = PDF_PALETTE;
  const blockColor = rgb(0.9, 0.91, 0.94);
  const lineColor = rgb(0.72, 0.74, 0.8);
  const margin = 56;
  const usable = pageW - margin * 2;

  for (let index = 0; index < count; index++) {
    const page = doc.addPage([pageW, pageH]);
    let y = pageH - margin;
    drawText(page, spec.title || 'Untitled document', { x: margin, y, size: 15, font: bold, color: ink });
    if (spec.pageNumbers) {
      drawText(page, `${index + 1} / ${count}`, { x: pageW - margin, y, size: 9, font, color: muted, align: 'right' });
    }
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1.4, color: accent });
    y -= 24;

    if (spec.contentStyle === 'lorem') {
      let paragraph = index * 4;
      while (y > margin + 30) {
        const text = LOREM_PARAGRAPHS[paragraph % LOREM_PARAGRAPHS.length]!;
        paragraph += 1;
        y = drawWrapped(page, text, font, 10.5, margin, y, usable, 15.5, muted) - 12;
      }
    } else {
      drawWireframe(page, mulberry32(index * 7919 + 41), margin, y, usable, margin + 20, blockColor, lineColor, accent);
    }

    if (spec.footer.trim()) {
      drawText(page, spec.footer, { x: margin, y: margin - 22, size: 8, font, color: faint });
    }
    if (spec.watermark.trim()) {
      drawWatermark(page, spec.watermark, pageW, pageH, bold);
    }
  }

  return doc.save();
}
