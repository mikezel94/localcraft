import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

import { drawText, hexColor, winAnsi } from '@/lib/pdf';

export interface WatermarkOptions {
  text: string;
  /** 0..1 */
  opacity: number;
  /** degrees, counterclockwise */
  angle: number;
  /** font size in pt */
  size: number;
  colorHex: string;
  /** repeat across the whole page instead of one center stamp */
  tile: boolean;
}

export async function applyWatermark(sourceBytes: Uint8Array, options: WatermarkOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  doc.setProducer('LocalCraft (client-side)');
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const color = options.colorHex ? hexColor(options.colorHex) : rgb(0.5, 0.5, 0.55);
  const text = winAnsi(options.text || 'SAMPLE');

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, options.size);
    if (options.tile) {
      const stepX = Math.max(textWidth + 60, 80);
      const stepY = Math.max(options.size * 4, 40);
      for (let y = 0; y < height + stepY; y += stepY) {
        for (let x = -textWidth; x < width + stepX; x += stepX) {
          page.drawText(text, {
            x,
            y,
            size: options.size,
            font,
            color,
            opacity: options.opacity,
            rotate: degrees(options.angle),
          });
        }
      }
    } else {
      drawText(page, text, {
        x: width / 2 - textWidth * 0.35,
        y: height / 2 - options.size * 0.5,
        size: options.size,
        font,
        color,
        opacity: options.opacity,
        rotate: degrees(options.angle),
      });
    }
  }
  return doc.save();
}
