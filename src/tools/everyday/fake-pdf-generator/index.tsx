import { FileDown } from 'lucide-react';
import { useState } from 'react';

import { PdfPreview } from '@/components/PdfPreview';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Segmented, Select, TextInput } from '@/components/ui/inputs';
import { ColorSwatches, TitleBlock } from '@/components/ui/misc';
import { useDebouncedBytes } from '@/lib/useDebouncedBytes';
import { downloadFile, slugify } from '@/lib/utils';
import { buildPlaceholderPdf, type PlaceholderSpec } from './pdf';

const ACCENTS = ['#3e45ce', '#2b2f42', '#b3382f', '#1f6f54', '#8a5a00'];

export default function PlaceholderPdfTool() {
  const [spec, setSpec] = useState<PlaceholderSpec>({
    pageCount: 3,
    pageSize: 'a4',
    landscape: false,
    contentStyle: 'lorem',
    title: 'Project proposal — draft',
    footer: 'Prepared with LocalCraft · sample document',
    pageNumbers: true,
    watermark: 'SAMPLE',
    accentHex: '#3e45ce',
  });

  const patch = (p: Partial<PlaceholderSpec>) => setSpec((s) => ({ ...s, ...p }));

  const specKey = JSON.stringify(spec);
  const { bytes, error } = useDebouncedBytes(() => buildPlaceholderPdf(spec), [specKey]);

  const fileName = `${slugify(spec.title || 'document')}.pdf`;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      {/* ——— Form column ——— */}
      <div className="space-y-9">
        <div className="flex flex-wrap items-center gap-2">
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
          <TitleBlock title="Layout" />
          <Segmented
            ariaLabel="Content style"
            options={[
              { value: 'lorem', label: 'Reading text' },
              { value: 'wireframe', label: 'Wireframe blocks' },
            ]}
            value={spec.contentStyle}
            onChange={(contentStyle) => patch({ contentStyle })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pages" htmlFor="fp-pages">
              <TextInput
                id="fp-pages"
                type="number"
                min={1}
                max={100}
                value={spec.pageCount}
                onChange={(e) => patch({ pageCount: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })}
              />
            </Field>
            <Field label="Page size" htmlFor="fp-size">
              <Select id="fp-size" value={spec.pageSize} onChange={(e) => patch({ pageSize: e.target.value as PlaceholderSpec['pageSize'] })}>
                <option value="a4">A4</option>
                <option value="letter">US Letter</option>
                <option value="a5">A5</option>
                <option value="legal">Legal</option>
              </Select>
            </Field>
          </div>
          <Checkbox label="Landscape orientation" checked={spec.landscape} onChange={(landscape) => patch({ landscape })} />
        </section>

        <section className="space-y-4">
          <TitleBlock title="Content" />
          <Field label="Title" htmlFor="fp-title">
            <TextInput id="fp-title" value={spec.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field label="Footer" htmlFor="fp-footer">
            <TextInput id="fp-footer" value={spec.footer} onChange={(e) => patch({ footer: e.target.value })} />
          </Field>
          <Field
            label="Watermark"
            htmlFor="fp-watermark"
            hint="Diagonal overprint on every page — leave empty for none."
          >
            <TextInput id="fp-watermark" value={spec.watermark} onChange={(e) => patch({ watermark: e.target.value })} />
          </Field>
          <Checkbox label="Page numbers" checked={spec.pageNumbers} onChange={(pageNumbers) => patch({ pageNumbers })} />
        </section>

        <section className="space-y-4">
          <TitleBlock title="Style" />
          <Field label="Accent">
            <ColorSwatches value={spec.accentHex} onChange={(accentHex) => patch({ accentHex })} presets={ACCENTS} />
          </Field>
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
