import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Segmented, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';
import { pickFile } from '@/lib/files';
import { applyWatermark, type WatermarkOptions } from './pdf';

export default function PdfWatermarker() {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<WatermarkOptions>({
    text: 'SAMPLE',
    opacity: 0.12,
    angle: 45,
    size: 56,
    colorHex: '#3e45ce',
    tile: false,
  });
  const [status, setStatus] = useState<{ kind: 'error' | 'busy' | 'done'; message: string } | null>(null);

  const patch = (p: Partial<WatermarkOptions>) => setOptions((o) => ({ ...o, ...p }));

  const run = async () => {
    if (!file) return;
    setStatus({ kind: 'busy', message: 'Stamping pages…' });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const output = await applyWatermark(bytes, options);
      downloadFile(output, `${file.name.replace(/\.pdf$/i, '')}-watermarked.pdf`, 'application/pdf');
      setStatus({ kind: 'done', message: `Watermarked ${file.name} (${formatBytes(bytes.length)}).` });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Watermarking failed — the PDF may be protected.' });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <TitleBlock title="Document" />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() =>
              void pickFile('application/pdf').then((picked) => {
                setFile(picked);
                setStatus(null);
              })
            }
          >
            Open PDF…
          </Button>
          {file ? <span className="font-mono text-[12.5px] text-muted">{file.name}</span> : null}
        </div>

        <TitleBlock title="Watermark" tone="pencil" />
        <Field label="Text" htmlFor="wm-text">
          <TextInput id="wm-text" value={options.text} onChange={(e) => patch({ text: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Size" htmlFor="wm-size">
            <TextInput id="wm-size" type="number" min={8} max={200} value={options.size} onChange={(e) => patch({ size: parseInt(e.target.value) || 56 })} className="text-right" />
          </Field>
          <Field label="Angle" htmlFor="wm-angle">
            <TextInput id="wm-angle" type="number" min={0} max={90} value={options.angle} onChange={(e) => patch({ angle: parseInt(e.target.value) || 0 })} className="text-right" />
          </Field>
          <Field label="Opacity %" htmlFor="wm-opacity">
            <TextInput
              id="wm-opacity"
              type="number"
              min={1}
              max={100}
              value={Math.round(options.opacity * 100)}
              onChange={(e) => patch({ opacity: Math.min(1, Math.max(0.01, (parseInt(e.target.value) || 10) / 100)) })}
              className="text-right"
            />
          </Field>
        </div>
        <Field label="Placement">
          <Segmented
            ariaLabel="Placement"
            options={[
              { value: 'center', label: 'Center stamp' },
              { value: 'tile', label: 'Tiled' },
            ]}
            value={options.tile ? 'tile' : 'center'}
            onChange={(v) => patch({ tile: v === 'tile' })}
          />
        </Field>
        <Field label="Color" htmlFor="wm-color">
          <div className="flex gap-2">
            <input
              id="wm-color"
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(options.colorHex) ? options.colorHex : '#3e45ce'}
              onChange={(e) => patch({ colorHex: e.target.value })}
              aria-label="Watermark color"
              className="size-10 cursor-pointer rounded-md border border-line bg-transparent p-1"
            />
            <TextInput value={options.colorHex} onChange={(e) => patch({ colorHex: e.target.value })} className="font-mono" aria-label="Watermark color value" />
          </div>
        </Field>
        <Button variant="primary" disabled={!file || status?.kind === 'busy'} onClick={() => void run()}>
          Watermark & download
        </Button>
        {status ? (
          <p
            role={status.kind === 'error' ? 'alert' : 'status'}
            className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted"
          >
            {status.kind === 'error' ? '✗ ' : '· '}
            {status.message}
          </p>
        ) : null}
        <p className="text-xs leading-snug text-faint">
          Watermarks are drawn onto every page in memory — the original file is never uploaded.
        </p>
      </div>

      <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-md border border-dashed border-line-strong bg-raised/40 p-10">
        <span
          aria-hidden
          className="select-none whitespace-nowrap font-display font-semibold"
          style={{
            transform: `rotate(${options.tile ? 0 : options.angle}deg)`,
            fontSize: `${Math.max(16, Math.min(120, options.size))}px`,
            color: options.colorHex,
            opacity: Math.max(0.05, options.opacity * 2.2),
          }}
        >
          {options.tile ? `${options.text || 'SAMPLE'} · ${options.text || 'SAMPLE'} · ${options.text || 'SAMPLE'}` : options.text || 'SAMPLE'}
        </span>
      </div>
    </div>
  );
}
