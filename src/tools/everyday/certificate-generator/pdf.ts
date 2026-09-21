import { PDFDocument, StandardFonts } from 'pdf-lib';

import { drawText, hexColor, PDF_PALETTE, winAnsi } from '@/lib/pdf';

export interface CertificateSpec {
  title: string;
  organization: string;
  recipient: string;
  reason: string;
  dateLabel: string;
  signerName: string;
  signerRole: string;
  secondSignerName: string;
  secondSignerRole: string;
  accentHex: string;
  showSeal: boolean;
}

function fitSize(text: string, font: { widthOfTextAtSize(text: string, size: number): number }, maxWidth: number, start: number): number {
  let size = start;
  while (size > 14 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 2;
  return size;
}

export async function buildCertificatePdf(spec: CertificateSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(winAnsi(`${spec.title} — ${spec.recipient}`));
  doc.setProducer('LocalCraft (client-side)');

  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const accent = hexColor(spec.accentHex);
  const { ink, muted } = PDF_PALETTE;
  const margin = 34;

  // Double frame: heavy accent band + inner hairline, drafting-style corner squares.
  page.drawRectangle({ x: margin, y: margin, width: width - margin * 2, height: height - margin * 2, borderColor: accent, borderWidth: 2.4 });
  page.drawRectangle({ x: margin + 8, y: margin + 8, width: width - (margin + 8) * 2, height: height - (margin + 8) * 2, borderColor: PDF_PALETTE.hairline, borderWidth: 0.8 });
  for (const [cx, cy] of [[margin + 8, margin + 8], [width - margin - 8, margin + 8], [margin + 8, height - margin - 8], [width - margin - 8, height - margin - 8]] as const) {
    page.drawRectangle({ x: cx - 4, y: cy - 4, width: 8, height: 8, color: accent });
  }

  const cx = width / 2;
  let y = height - 92;

  if (spec.organization.trim()) {
    drawText(page, spec.organization.toUpperCase(), { x: cx, y, size: 11, font, color: muted, align: 'center' });
    y -= 40;
  }
  drawText(page, spec.title || 'Certificate', { x: cx, y, size: 30, font: bold, color: ink, align: 'center' });
  y -= 24;
  page.drawLine({ start: { x: cx - 60, y }, end: { x: cx + 60, y }, thickness: 1.6, color: accent });
  y -= 44;

  drawText(page, 'This certificate is proudly presented to', { x: cx, y, size: 11, font, color: muted, align: 'center' });
  y -= 52;
  const nameSize = fitSize(spec.recipient || 'Recipient Name', bold, width - 200, 44);
  drawText(page, spec.recipient || 'Recipient Name', { x: cx, y, size: nameSize, font: bold, color: accent, align: 'center' });
  y -= 34;
  page.drawLine({ start: { x: cx - 180, y: y + 10 }, end: { x: cx + 180, y: y + 10 }, thickness: 0.8, color: PDF_PALETTE.hairline });
  y -= 40;

  drawText(page, spec.reason || 'for outstanding work and steady craft.', { x: cx, y, size: 13, font: oblique, color: ink, align: 'center' });
  y -= 46;
  drawText(page, spec.dateLabel, { x: cx, y, size: 11, font, color: muted, align: 'center' });

  // Signature lines
  const signY = margin + 66;
  const signers = [
    { name: spec.signerName, role: spec.signerRole, x: cx - 240 },
    { name: spec.secondSignerName, role: spec.secondSignerRole, x: cx + 240 },
  ].filter((signer) => signer.name.trim() || signer.role.trim());
  for (const signer of signers) {
    page.drawLine({ start: { x: signer.x - 110, y: signY }, end: { x: signer.x + 110, y: signY }, thickness: 0.8, color: muted });
    drawText(page, signer.name, { x: signer.x, y: signY - 16, size: 12, font: bold, color: ink, align: 'center' });
    drawText(page, signer.role, { x: signer.x, y: signY - 30, size: 9.5, font, color: muted, align: 'center' });
  }

  // Seal
  if (spec.showSeal) {
    const sx = width - margin - 84;
    const sy = margin + 84;
    page.drawCircle({ x: sx, y: sy, size: 34, borderColor: accent, borderWidth: 1.6 });
    page.drawCircle({ x: sx, y: sy, size: 27, borderColor: accent, borderWidth: 0.8 });
    drawText(page, 'SEALED', { x: sx, y: sy + 2, size: 8, font: bold, color: accent, align: 'center' });
    drawText(page, 'LOCALLY', { x: sx, y: sy - 8, size: 6.5, font, color: accent, align: 'center' });
  }

  return doc.save();
}
