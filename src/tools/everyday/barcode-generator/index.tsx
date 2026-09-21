import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Select, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';

const FORMATS = [
  { value: 'code128', label: 'Code 128 (general)' },
  { value: 'code39', label: 'Code 39' },
  { value: 'ean13', label: 'EAN-13 (retail)' },
  { value: 'upca', label: 'UPC-A' },
  { value: 'itf14', label: 'ITF-14 (cartons)' },
] as const;

type Format = (typeof FORMATS)[number]['value'];

const SAMPLES: Record<Format, string> = {
  code128: 'LOCALCRAFT-2026',
  code39: 'CRAFT 2026',
  ean13: '590123412345',
  upca: '03600029145',
  itf14: '1234567890123',
};

export default function BarcodeGenerator() {
  const [format, setFormat] = useState<Format>('code128');
  const [value, setValue] = useState(SAMPLES.code128);
  const [height, setHeight] = useState('90');
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { toCanvas } = await import('bwip-js/browser');
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      try {
        toCanvas(canvas, {
          bcid: format,
          text: value,
          height: Math.max(20, parseInt(height) || 90),
          includetext: true,
          textxalign: 'center',
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message.replace(/^bwip-js:\s*/, '') : 'Invalid value for this format.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [format, value, height]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="Barcode" />
        <Field label="Format" htmlFor="bc-format">
          <Select
            id="bc-format"
            value={format}
            onChange={(e) => {
              const next = e.target.value as Format;
              setFormat(next);
              setValue(SAMPLES[next]);
            }}
          >
            {FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Value" htmlFor="bc-value" hint={format === 'ean13' ? '12 digits — the check digit is computed for you.' : format === 'upca' ? '11 digits — check digit computed.' : undefined}>
          <TextInput id="bc-value" value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" spellCheck={false} />
        </Field>
        <Field label="Height (px)" htmlFor="bc-height">
          <TextInput id="bc-height" type="number" min={30} max={200} value={height} onChange={(e) => setHeight(e.target.value)} className="w-28! text-right" />
        </Field>
        {error ? (
          <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
            ✗ {error}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <TitleBlock title="Preview" tone="pencil" />
        <div className="flex items-center justify-center rounded-md border border-line bg-surface p-8">
          {error ? (
            <p className="text-sm text-faint">Fix the value to render the barcode.</p>
          ) : (
            <canvas ref={canvasRef} role="img" aria-label="Barcode preview" className="max-w-full" />
          )}
        </div>
        <Button
          variant="primary"
          disabled={Boolean(error)}
          onClick={() => {
            const canvas = canvasRef.current;
            canvas?.toBlob((blob) => blob && downloadFile(blob, `barcode-${format}.png`, 'image/png'));
          }}
        >
          Download PNG
        </Button>
      </div>
    </div>
  );
}
