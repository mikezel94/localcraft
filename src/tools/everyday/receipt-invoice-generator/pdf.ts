import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib';

import {
  drawDashed,
  drawText,
  drawWrapped,
  hashString,
  hexColor,
  mulberry32,
  PAGE_SIZES,
  PDF_PALETTE,
  winAnsi,
  wrapText,
} from '@/lib/pdf';
import { formatDateTime, formatMoney, formatQuantity } from '@/lib/utils';

export type PaperStyle = 'a4' | 'letter' | 'thermal';

export interface ItemRow {
  id: string;
  description: string;
  qty: string;
  unitPrice: string;
}

export interface ReceiptSpec {
  docType: 'receipt' | 'invoice';
  businessName: string;
  businessDetails: string;
  documentNumber: string;
  /** datetime-local string */
  issuedAt: string;
  servedBy: string;
  customerName: string;
  currencySymbol: string;
  items: ItemRow[];
  taxPercent: string;
  discountPercent: string;
  tipAmount: string;
  note: string;
  accentHex: string;
  paper: PaperStyle;
  showThankYou: boolean;
  showSampleStamp: boolean;
  logoDataUrl: string | null;
}

export interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
}

const num = (value: string): number => {
  const parsed = parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

function parseRows(items: ItemRow[]): { description: string; qty: number; unitPrice: number }[] {
  return items
    .map((row) => ({
      description: row.description.trim(),
      qty: num(row.qty),
      unitPrice: num(row.unitPrice),
    }))
    .filter((row) => row.description !== '' || row.qty !== 0 || row.unitPrice !== 0);
}

export function computeTotals(items: ItemRow[], taxPercent: string, discountPercent: string, tipAmount: string): Totals {
  const rows = parseRows(items);
  const subtotal = rows.reduce((sum, row) => sum + row.qty * row.unitPrice, 0);
  const discount = subtotal * (num(discountPercent) / 100);
  const tax = (subtotal - discount) * (num(taxPercent) / 100);
  const tip = num(tipAmount);
  return { subtotal, discount, tax, tip, total: subtotal - discount + tax + tip };
}

async function embedLogo(doc: PDFDocument, dataUrl: string): Promise<PDFImage> {
  const response = await fetch(dataUrl);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return dataUrl.includes('image/png') ? doc.embedPng(bytes) : doc.embedJpg(bytes);
}

/** Diagonal overprint "SAMPLE" — centering approximation is fine for a stamp. */
function drawSampleStamp(page: PDFPage, pageW: number, pageH: number, font: PDFFont): void {
  const size = Math.min(64, pageW * 0.2);
  const width = font.widthOfTextAtSize('SAMPLE', size);
  page.drawText('SAMPLE', {
    x: pageW / 2 - width * 0.35,
    y: pageH / 2 - size * 0.5,
    size,
    font,
    color: rgb(0.45, 0.47, 0.55),
    opacity: 0.09,
    rotate: degrees(45),
  });
}

async function buildDocumentPdf(spec: ReceiptSpec): Promise<Uint8Array> {
  const [a, b] = PAGE_SIZES[spec.paper === 'letter' ? 'letter' : 'a4'];
  const pageW = a;
  const pageH = b;

  const doc = await PDFDocument.create();
  doc.setTitle(winAnsi(`${spec.docType === 'invoice' ? 'Invoice' : 'Receipt'} ${spec.documentNumber} — ${spec.businessName}`));
  doc.setProducer('LocalCraft (client-side)');

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const accent = hexColor(spec.accentHex);
  const { ink, muted, hairline, faint } = PDF_PALETTE;
  const money = (value: number) => formatMoney(value, spec.currencySymbol);
  const rows = parseRows(spec.items);
  const totals = computeTotals(spec.items, spec.taxPercent, spec.discountPercent, spec.tipAmount);
  const docLabel = spec.docType === 'invoice' ? 'INVOICE' : 'RECEIPT';

  const margin = 54;
  const usable = pageW - margin * 2;

  let page = doc.addPage([pageW, pageH]);
  const newPage = () => {
    page = doc.addPage([pageW, pageH]);
    return page;
  };

  let logo: PDFImage | null = null;
  if (spec.logoDataUrl) {
    try {
      logo = await embedLogo(doc, spec.logoDataUrl);
    } catch {
      /* unreadable image — carry on without it */
    }
  }

  // — Header —
  let y = pageH - margin;
  let textX = margin;
  if (logo) {
    const logoH = 46;
    const logoW = (logo.width / logo.height) * logoH;
    page.drawImage(logo, { x: margin, y: y - logoH + 10, width: logoW, height: logoH });
    textX = margin + logoW + 14;
  }
  drawText(page, spec.businessName || 'Your business', { x: textX, y: y - 14, size: 19, font: bold, color: ink });
  if (spec.businessDetails.trim()) {
    let detailsY = y - 30;
    for (const line of wrapText(spec.businessDetails, font, 8.5, usable * 0.55)) {
      drawText(page, line, { x: textX, y: detailsY, size: 8.5, font, color: muted });
      detailsY -= 11;
    }
  }
  drawText(page, docLabel, { x: pageW - margin, y: y - 14, size: 21, font: bold, color: accent, align: 'right' });
  drawText(page, `No. ${spec.documentNumber}`, { x: pageW - margin, y: y - 32, size: 10, font, color: ink, align: 'right' });
  drawText(page, `Issued ${formatDateTime(spec.issuedAt)}`, { x: pageW - margin, y: y - 45, size: 8.5, font, color: muted, align: 'right' });

  y -= 62;
  page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 1.6, color: accent });
  y -= 26;

  // — Parties —
  drawText(page, spec.docType === 'invoice' ? 'Billed to' : 'Customer', { x: margin, y, size: 8, font, color: muted });
  drawText(page, spec.customerName || 'Walk-in customer', { x: margin, y: y - 15, size: 12.5, font: bold, color: ink });
  if (spec.servedBy.trim()) {
    drawText(page, `Served by ${spec.servedBy}`, { x: margin, y: y - 31, size: 9.5, font, color: muted });
  }

  const metaLabelX = pageW - margin - 150;
  const metaRows: [string, string][] = [
    ['Document', spec.documentNumber],
    ['Issued', formatDateTime(spec.issuedAt)],
  ];
  if (spec.servedBy.trim()) metaRows.push(['Served by', spec.servedBy]);
  let metaY = y;
  for (const [k, v] of metaRows) {
    drawText(page, k, { x: metaLabelX, y: metaY, size: 8.5, font, color: muted });
    drawText(page, v, { x: pageW - margin, y: metaY, size: 8.5, font, color: ink, align: 'right' });
    metaY -= 13;
  }

  y -= 52;

  // — Items table —
  const colQtyX = pageW - margin - 150;
  const colPriceX = pageW - margin - 72;
  const colAmountX = pageW - margin;
  const descWidth = colQtyX - margin - 16;

  const drawTableHeader = (target: PDFPage, headerY: number) => {
    drawText(target, 'Description', { x: margin, y: headerY, size: 8, font, color: muted });
    drawText(target, 'Qty', { x: colQtyX, y: headerY, size: 8, font, color: muted, align: 'right' });
    drawText(target, 'Unit price', { x: colPriceX, y: headerY, size: 8, font, color: muted, align: 'right' });
    drawText(target, 'Amount', { x: colAmountX, y: headerY, size: 8, font, color: muted, align: 'right' });
    target.drawLine({ start: { x: margin, y: headerY - 6 }, end: { x: pageW - margin, y: headerY - 6 }, thickness: 0.8, color: hairline });
  };
  drawTableHeader(page, y);
  y -= 22;

  for (const row of rows) {
    const descLines = wrapText(row.description || '—', font, 10, descWidth);
    const rowH = Math.max(18, descLines.length * 13 + 7);
    if (y - rowH < margin + 190) {
      page = newPage();
      y = pageH - margin - 8;
      drawText(page, `${spec.businessName || 'Your business'} — ${docLabel} ${spec.documentNumber} (continued)`, {
        x: margin,
        y,
        size: 9,
        font: bold,
        color: muted,
      });
      y -= 20;
      drawTableHeader(page, y);
      y -= 22;
    }
    descLines.forEach((line, i) => {
      drawText(page, line, { x: margin, y: y - i * 13, size: 10, font, color: ink });
    });
    drawText(page, formatQuantity(row.qty), { x: colQtyX, y, size: 10, font, color: ink, align: 'right' });
    drawText(page, money(row.unitPrice), { x: colPriceX, y, size: 10, font, color: ink, align: 'right' });
    drawText(page, money(row.qty * row.unitPrice), { x: colAmountX, y, size: 10, font: bold, color: ink, align: 'right' });
    y -= rowH;
    page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: pageW - margin, y: y + 5 }, thickness: 0.5, color: hairline });
  }

  // — Totals —
  if (y < margin + 200) {
    page = newPage();
    y = pageH - margin - 8;
  }
  y -= 12;
  const totalLabelX = pageW - margin - 200;
  const totalRows: [string, string][] = [['Subtotal', money(totals.subtotal)]];
  if (totals.discount > 0) totalRows.push([`Discount (${num(spec.discountPercent)}%)`, `−${money(totals.discount)}`]);
  if (totals.tax > 0) totalRows.push([`Tax (${num(spec.taxPercent)}%)`, money(totals.tax)]);
  if (totals.tip > 0) totalRows.push(['Tip', money(totals.tip)]);
  for (const [k, v] of totalRows) {
    drawText(page, k, { x: totalLabelX, y, size: 9.5, font, color: muted });
    drawText(page, v, { x: pageW - margin, y, size: 9.5, font, color: ink, align: 'right' });
    y -= 15;
  }
  page.drawLine({ start: { x: totalLabelX, y: y + 5 }, end: { x: pageW - margin, y: y + 5 }, thickness: 1, color: ink });
  y -= 9;
  drawText(page, 'Total', { x: totalLabelX, y, size: 15, font: bold, color: ink });
  drawText(page, money(totals.total), { x: pageW - margin, y, size: 15, font: bold, color: accent, align: 'right' });
  y -= 26;

  if (spec.note.trim()) {
    drawWrapped(page, spec.note, oblique, 9, margin, y + 40, 250, 13, muted);
  }
  if (spec.showThankYou) {
    drawText(
      page,
      spec.docType === 'invoice'
        ? 'Payment due on receipt. This is a sample document.'
        : 'Thank you for your visit! This is a sample document.',
      { x: pageW / 2, y, size: 9, font: oblique, color: muted, align: 'center' },
    );
  }

  // — Shared footers —
  const allPages = doc.getPages();
  allPages.forEach((p, i) => {
    drawText(p, 'Generated locally with LocalCraft — nothing left your browser.', { x: margin, y: margin - 20, size: 7.5, font, color: faint });
    drawText(p, `Page ${i + 1} of ${allPages.length}`, { x: pageW - margin, y: margin - 20, size: 7.5, font, color: faint, align: 'right' });
  });
  if (spec.showSampleStamp) {
    for (const p of allPages) drawSampleStamp(p, pageW, pageH, bold);
  }

  return doc.save();
}

type ThermalOp =
  | { kind: 'text'; text: string; x: number; align: 'left' | 'right' | 'center'; size: number; font: PDFFont; color: RGB }
  | { kind: 'pair'; left: string; right: string; size: number; font: PDFFont; color: RGB }
  | { kind: 'rule'; dashed: boolean }
  | { kind: 'gap'; height: number }
  | { kind: 'bars'; seed: number };

/** 80 mm thermal-roll receipt with a deterministic fake barcode. */
async function buildThermalPdf(spec: ReceiptSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(winAnsi(`Receipt ${spec.documentNumber} — ${spec.businessName}`));
  doc.setProducer('LocalCraft (client-side)');

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const monoBold = await doc.embedFont(StandardFonts.CourierBold);

  const W = 226.77; // 80 mm
  const pad = 14;
  const contentW = W - pad * 2;
  const accent = hexColor(spec.accentHex);
  const { ink, muted, faint } = PDF_PALETTE;
  const money = (value: number) => formatMoney(value, spec.currencySymbol);
  const rows = parseRows(spec.items);
  const totals = computeTotals(spec.items, spec.taxPercent, spec.discountPercent, spec.tipAmount);

  const ops: ThermalOp[] = [];
  const center = (text: string, size: number, f: PDFFont, color: RGB) =>
    ops.push({ kind: 'text', text, x: W / 2, align: 'center', size, font: f, color });
  const pair = (left: string, right: string, size: number, f: PDFFont, color: RGB) =>
    ops.push({ kind: 'pair', left, right, size, font: f, color });

  center(spec.businessName || 'Your business', 13, bold, ink);
  for (const line of wrapText(spec.businessDetails, font, 7.5, contentW)) {
    center(line, 7.5, font, muted);
  }
  ops.push({ kind: 'gap', height: 6 });
  ops.push({ kind: 'rule', dashed: true });
  pair(`No. ${spec.documentNumber}`, formatDateTime(spec.issuedAt), 8, mono, ink);
  if (spec.servedBy.trim()) pair('Served by', spec.servedBy, 8, mono, muted);
  if (spec.customerName.trim()) pair('Customer', spec.customerName, 8, mono, muted);
  ops.push({ kind: 'rule', dashed: true });

  for (const row of rows) {
    const lines = wrapText(row.description || '—', mono, 8.5, contentW - 54);
    lines.forEach((line, i) => {
      if (i === 0) pair(line, money(row.qty * row.unitPrice), 8.5, mono, ink);
      else ops.push({ kind: 'text', text: line, x: pad, align: 'left', size: 8.5, font: mono, color: ink });
    });
    ops.push({
      kind: 'text',
      text: `${formatQuantity(row.qty)} x ${money(row.unitPrice)}`,
      x: pad + 10,
      align: 'left',
      size: 7.5,
      font: mono,
      color: muted,
    });
    ops.push({ kind: 'gap', height: 3 });
  }

  ops.push({ kind: 'rule', dashed: true });
  pair('Subtotal', money(totals.subtotal), 8.5, mono, ink);
  if (totals.discount > 0) pair(`Discount ${num(spec.discountPercent)}%`, `-${money(totals.discount)}`, 8.5, mono, muted);
  if (totals.tax > 0) pair(`Tax ${num(spec.taxPercent)}%`, money(totals.tax), 8.5, mono, ink);
  if (totals.tip > 0) pair('Tip', money(totals.tip), 8.5, mono, ink);
  ops.push({ kind: 'gap', height: 3 });
  pair('TOTAL', money(totals.total), 12, monoBold, accent);
  if (spec.showThankYou) {
    ops.push({ kind: 'gap', height: 4 });
    center('Thank you — please come again!', 8, font, ink);
  }
  ops.push({ kind: 'gap', height: 4 });
  ops.push({ kind: 'rule', dashed: true });
  ops.push({ kind: 'bars', seed: hashString(`${spec.businessName}#${spec.documentNumber}`) });
  ops.push({ kind: 'gap', height: 5 });
  center('sample receipt — generated locally with LocalCraft', 6.5, font, faint);

  // Measure the roll first, then render top-down.
  const RULE_H = 9;
  const BARS_H = 42;
  let height = pad * 2;
  for (const op of ops) {
    if (op.kind === 'text') height += op.size + 3.5;
    else if (op.kind === 'pair') height += op.size + 4.5;
    else if (op.kind === 'rule') height += RULE_H;
    else if (op.kind === 'gap') height += op.height;
    else height += BARS_H;
  }

  const page = doc.addPage([W, height]);
  let y = height - pad;
  for (const op of ops) {
    switch (op.kind) {
      case 'text':
        drawText(page, op.text, { x: op.x, y, size: op.size, font: op.font, color: op.color, align: op.align });
        y -= op.size + 3.5;
        break;
      case 'pair':
        drawText(page, op.left, { x: pad, y, size: op.size, font: op.font, color: op.color });
        drawText(page, op.right, { x: W - pad, y, size: op.size, font: op.font, color: op.color, align: 'right' });
        y -= op.size + 4.5;
        break;
      case 'rule':
        if (op.dashed) drawDashed(page, { x: pad, y }, { x: W - pad, y }, { thickness: 0.8, color: muted });
        else page.drawLine({ start: { x: pad, y }, end: { x: W - pad, y }, thickness: 0.8, color: muted });
        y -= RULE_H;
        break;
      case 'gap':
        y -= op.height;
        break;
      case 'bars': {
        const rng = mulberry32(op.seed);
        let x = pad;
        while (x < W - pad) {
          const barW = 1 + Math.floor(rng() * 3);
          if (rng() > 0.42) {
            page.drawRectangle({ x, y: y - 30, width: barW, height: 30, color: ink });
          }
          x += barW + 1 + (rng() < 0.2 ? 1 : 0);
        }
        y -= BARS_H;
        break;
      }
    }
  }

  if (spec.showSampleStamp) drawSampleStamp(page, W, height, bold);

  return doc.save();
}

export async function buildReceiptPdf(spec: ReceiptSpec): Promise<Uint8Array> {
  return spec.paper === 'thermal' ? buildThermalPdf(spec) : buildDocumentPdf(spec);
}
