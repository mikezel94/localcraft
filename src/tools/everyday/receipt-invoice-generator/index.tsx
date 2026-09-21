import { FileDown, ImagePlus, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { PdfPreview } from '@/components/PdfPreview';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Segmented, Select, TextArea, TextInput } from '@/components/ui/inputs';
import { ColorSwatches, TitleBlock } from '@/components/ui/misc';
import { useDebouncedBytes } from '@/lib/useDebouncedBytes';
import { downloadFile, formatMoney, slugify, toDateTimeLocalValue, uid } from '@/lib/utils';
import { buildReceiptPdf, computeTotals, type ItemRow, type ReceiptSpec } from './pdf';
import { makeSampleSpec } from './samples';

const ACCENTS = ['#2b2f42', '#3e45ce', '#b3382f', '#1f6f54', '#8a5a00'];
const CURRENCIES = [
  { code: 'USD ($)', symbol: '$' },
  { code: 'EUR (€)', symbol: '€' },
  { code: 'GBP (£)', symbol: '£' },
  { code: 'JPY (¥)', symbol: '¥' },
  { code: 'INR (₹)', symbol: '₹' },
  { code: 'BRL (R$)', symbol: 'R$' },
];

function defaultSpec(): ReceiptSpec {
  return {
    docType: 'receipt',
    businessName: 'Nordwind Coffee Roasters',
    businessDetails: '14 Harbour Lane, Portland OR\n(503) 555-0141 · hello@nordwind.coffee',
    documentNumber: 'R-1042',
    issuedAt: toDateTimeLocalValue(new Date()),
    servedBy: 'Noor',
    customerName: '',
    currencySymbol: '$',
    items: [
      { id: uid(), description: 'Flat white', qty: '1', unitPrice: '4.20' },
      { id: uid(), description: 'Cardamom bun', qty: '2', unitPrice: '3.80' },
      { id: uid(), description: 'Ethiopia pour-over, 250g bag', qty: '1', unitPrice: '16.50' },
    ],
    taxPercent: '8.5',
    discountPercent: '0',
    tipAmount: '2.00',
    note: '',
    accentHex: '#2b2f42',
    paper: 'a4',
    showThankYou: true,
    showSampleStamp: true,
    logoDataUrl: null,
  };
}

export default function ReceiptInvoiceTool() {
  const [spec, setSpec] = useState<ReceiptSpec>(defaultSpec);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<ReceiptSpec>) => setSpec((s) => ({ ...s, ...p }));

  const totals = useMemo(
    () => computeTotals(spec.items, spec.taxPercent, spec.discountPercent, spec.tipAmount),
    [spec.items, spec.taxPercent, spec.discountPercent, spec.tipAmount],
  );

  const specKey = JSON.stringify(spec);
  const { bytes, error } = useDebouncedBytes(() => buildReceiptPdf(spec), [specKey]);

  const updateItem = (id: string, p: Partial<ItemRow>) =>
    setSpec((s) => ({ ...s, items: s.items.map((item) => (item.id === id ? { ...item, ...p } : item)) }));
  const addItem = () =>
    setSpec((s) => ({ ...s, items: [...s.items, { id: uid(), description: '', qty: '1', unitPrice: '0.00' }] }));
  const removeItem = (id: string) => setSpec((s) => ({ ...s, items: s.items.filter((item) => item.id !== id) }));

  const onLogoFile = (file: File | undefined) => {
    setLogoError(null);
    if (!file) return;
    if (!/image\/(png|jpeg)/.test(file.type)) {
      setLogoError('Logos must be PNG or JPEG.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => patch({ logoDataUrl: reader.result as string });
    reader.onerror = () => setLogoError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const fileName = `${spec.docType}-${slugify(spec.businessName)}-${slugify(spec.documentNumber)}.pdf`;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      {/* ——— Form column ——— */}
      <div className="space-y-9">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setSpec((s) => makeSampleSpec(s))}>
            <RefreshCw className="size-4" aria-hidden />
            Sample data
          </Button>
          <Button
            variant="primary"
            disabled={!bytes}
            onClick={() => bytes && downloadFile(bytes, fileName, 'application/pdf')}
          >
            <FileDown className="size-4" aria-hidden />
            Download PDF
          </Button>
          {error ? <span className="text-xs text-muted">Build failed: {error}</span> : null}
        </div>

        <section className="space-y-4">
          <TitleBlock title="Document" tone="pencil" />
          <Segmented
            ariaLabel="Document type"
            options={[
              { value: 'receipt', label: 'Receipt' },
              { value: 'invoice', label: 'Invoice' },
            ]}
            value={spec.docType}
            onChange={(docType) => patch({ docType })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number" htmlFor="rc-number">
              <TextInput
                id="rc-number"
                value={spec.documentNumber}
                onChange={(e) => patch({ documentNumber: e.target.value })}
              />
            </Field>
            <Field label="Issued" htmlFor="rc-date">
              <TextInput
                id="rc-date"
                type="datetime-local"
                value={spec.issuedAt}
                onChange={(e) => patch({ issuedAt: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Served by" htmlFor="rc-served">
              <TextInput id="rc-served" value={spec.servedBy} onChange={(e) => patch({ servedBy: e.target.value })} />
            </Field>
            <Field label="Customer" htmlFor="rc-customer">
              <TextInput
                id="rc-customer"
                value={spec.customerName}
                onChange={(e) => patch({ customerName: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <TitleBlock title="Business" tone="pencil" />
          <Field label="Name" htmlFor="rc-name">
            <TextInput id="rc-name" value={spec.businessName} onChange={(e) => patch({ businessName: e.target.value })} />
          </Field>
          <Field label="Details" htmlFor="rc-details" hint="Address, phone, tax id — one per line.">
            <TextArea
              id="rc-details"
              value={spec.businessDetails}
              onChange={(e) => patch({ businessDetails: e.target.value })}
            />
          </Field>
          <Field label="Logo" hint="Optional, PNG or JPEG. It stays on your machine.">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                onLogoFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {spec.logoDataUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={spec.logoDataUrl}
                  alt="Logo preview"
                  className="h-10 w-10 rounded border border-line object-contain"
                />
                <Button variant="ghost" onClick={() => patch({ logoDataUrl: null })}>
                  <X className="size-4" aria-hidden />
                  Remove
                </Button>
              </div>
            ) : (
              <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="size-4" aria-hidden />
                Add logo
              </Button>
            )}
            {logoError ? <p className="text-xs text-muted">{logoError}</p> : null}
          </Field>
        </section>

        <section className="space-y-3">
          <TitleBlock title="Line items" tone="pencil" />
          {spec.items.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <TextInput
                value={item.description}
                placeholder="Description"
                aria-label="Item description"
                className="flex-1"
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
              />
              <TextInput
                value={item.qty}
                inputMode="decimal"
                aria-label="Quantity"
                className="w-16! text-right"
                onChange={(e) => updateItem(item.id, { qty: e.target.value })}
              />
              <TextInput
                value={item.unitPrice}
                inputMode="decimal"
                aria-label="Unit price"
                className="w-20! text-right"
                onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
              />
              <span className="w-20 text-right font-mono text-[12px] text-muted">
                {formatMoney((parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0), spec.currencySymbol)}
              </span>
              <button
                type="button"
                aria-label="Remove line"
                onClick={() => removeItem(item.id)}
                className="cursor-pointer rounded p-1.5 text-faint transition-colors hover:text-fg"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
          <Button variant="ghost" onClick={addItem} className="px-2">
            <Plus className="size-4" aria-hidden />
            Add line
          </Button>

          <dl className="space-y-1 rounded-md border border-line bg-raised/50 p-4 font-mono text-[12.5px] text-muted">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(totals.subtotal, spec.currencySymbol)}</dd>
            </div>
            {totals.discount > 0 ? (
              <div className="flex justify-between">
                <dt>Discount</dt>
                <dd>−{formatMoney(totals.discount, spec.currencySymbol)}</dd>
              </div>
            ) : null}
            {totals.tax > 0 ? (
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>{formatMoney(totals.tax, spec.currencySymbol)}</dd>
              </div>
            ) : null}
            {totals.tip > 0 ? (
              <div className="flex justify-between">
                <dt>Tip</dt>
                <dd>{formatMoney(totals.tip, spec.currencySymbol)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-line pt-1.5 text-[14px] font-semibold text-fg">
              <dt>Total</dt>
              <dd>{formatMoney(totals.total, spec.currencySymbol)}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-4">
          <TitleBlock title="Adjustments" tone="pencil" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Tax %" htmlFor="rc-tax">
              <TextInput
                id="rc-tax"
                inputMode="decimal"
                value={spec.taxPercent}
                onChange={(e) => patch({ taxPercent: e.target.value })}
              />
            </Field>
            <Field label="Discount %" htmlFor="rc-discount">
              <TextInput
                id="rc-discount"
                inputMode="decimal"
                value={spec.discountPercent}
                onChange={(e) => patch({ discountPercent: e.target.value })}
              />
            </Field>
            <Field label="Tip" htmlFor="rc-tip">
              <TextInput
                id="rc-tip"
                inputMode="decimal"
                value={spec.tipAmount}
                onChange={(e) => patch({ tipAmount: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Note" htmlFor="rc-note" hint="Shown on A4/Letter documents.">
            <TextArea id="rc-note" value={spec.note} className="min-h-16" onChange={(e) => patch({ note: e.target.value })} />
          </Field>
        </section>

        <section className="space-y-4">
          <TitleBlock title="Style" tone="pencil" />
          <Segmented
            ariaLabel="Paper style"
            options={[
              { value: 'a4', label: 'A4' },
              { value: 'letter', label: 'US Letter' },
              { value: 'thermal', label: 'Thermal 80mm' },
            ]}
            value={spec.paper}
            onChange={(paper) => patch({ paper })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency" htmlFor="rc-currency">
              <Select
                id="rc-currency"
                value={spec.currencySymbol}
                onChange={(e) => patch({ currencySymbol: e.target.value })}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.symbol}>
                    {currency.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Accent">
              <ColorSwatches value={spec.accentHex} onChange={(accentHex) => patch({ accentHex })} presets={ACCENTS} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-5 pt-1">
            <Checkbox label="Thank-you line" checked={spec.showThankYou} onChange={(showThankYou) => patch({ showThankYou })} />
            <Checkbox
              label="SAMPLE stamp"
              checked={spec.showSampleStamp}
              onChange={(showSampleStamp) => patch({ showSampleStamp })}
            />
          </div>
        </section>
      </div>

      {/* ——— Preview column ——— */}
      <div className="min-w-0">
        <div className="lg:sticky lg:top-20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] text-faint">Live preview</h2>
            <span className="font-mono text-[11px] text-faint">updates as you type</span>
          </div>
          <PdfPreview bytes={bytes} className="max-h-[78vh]" />
        </div>
      </div>
    </div>
  );
}
