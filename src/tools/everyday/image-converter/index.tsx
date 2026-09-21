import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, Segmented, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { pickFile } from '@/lib/files';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';

type Format = 'png' | 'jpeg' | 'webp' | 'avif';

const MIME: Record<Format, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' };

export default function ImageConverter() {
  const [source, setSource] = useState<{ file: File; url: string; width: number; height: number } | null>(null);
  const [format, setFormat] = useState<Format>('webp');
  const [quality, setQuality] = useState('85');
  const [maxWidth, setMaxWidth] = useState('');
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const convert = useCallback(async () => {
    if (!source) return;
    const image = new Image();
    image.src = source.url;
    await image.decode();
    const canvas = canvasRef.current ?? document.createElement('canvas');
    const targetWidth = maxWidth ? Math.min(parseInt(maxWidth) || source.width, source.width) : source.width;
    const scale = targetWidth / source.width;
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff'; // flatten transparency for JPEG
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, MIME[format], format === 'png' ? undefined : parseInt(quality) / 100),
    );
    if (blob) setResult({ blob, url: URL.createObjectURL(blob) });
  }, [source, format, quality, maxWidth]);

  useEffect(() => {
    void convert();
  }, [convert]);

  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <TitleBlock title="Image" />
        <Button
          onClick={() =>
            void pickFile('image/*').then((file) => {
              if (!file) return;
              const url = URL.createObjectURL(file);
              const image = new Image();
              image.onload = () => setSource({ file, url, width: image.naturalWidth, height: image.naturalHeight });
              image.src = url;
              setResult(null);
            })
          }
        >
          Open image…
        </Button>
        {source ? (
          <p className="font-mono text-[12.5px] text-muted">
            {source.file.name} · {source.width}×{source.height} · {formatBytes(source.file.size)}
          </p>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
            PNG, JPEG, WebP or AVIF — decoded on the canvas API, never uploaded.
          </p>
        )}

        {source ? (
          <>
            <TitleBlock title="Output" tone="pencil" />
            <Segmented
              ariaLabel="Output format"
              options={[
                { value: 'webp', label: 'WebP' },
                { value: 'avif', label: 'AVIF' },
                { value: 'jpeg', label: 'JPEG' },
                { value: 'png', label: 'PNG' },
              ]}
              value={format}
              onChange={(f) => setFormat(f as Format)}
            />
            {format !== 'png' ? (
              <Field label={`Quality — ${quality}%`} htmlFor="img-quality">
                <input
                  id="img-quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full cursor-pointer accent-[var(--ink)]"
                />
              </Field>
            ) : null}
            <Field label="Max width (px, optional)" htmlFor="img-width" hint="Image is scaled down proportionally; never enlarged.">
              <TextInput
                id="img-width"
                type="number"
                min={1}
                placeholder={String(source.width)}
                value={maxWidth}
                onChange={(e) => setMaxWidth(e.target.value)}
              />
            </Field>
          </>
        ) : null}
      </div>

      <div className="space-y-4">
        <TitleBlock title="Preview & result" tone="pencil" />
        {source && result ? (
          <>
            <div className="flex max-h-[26rem] items-center justify-center overflow-hidden rounded-md border border-line bg-raised/50 p-4">
              <img src={result.url} alt="Converted preview" className="max-h-96 max-w-full object-contain" />
            </div>
            <p className="font-mono text-[12.5px] text-muted">
              {format.toUpperCase()} · {formatBytes(result.blob.size)}{' '}
              <span className={result.blob.size <= source.file.size ? 'text-pencil' : 'text-faint'}>
                ({result.blob.size <= source.file.size ? '−' : '+'}
                {formatBytes(Math.abs(source.file.size - result.blob.size))} vs original)
              </span>
            </p>
            <Button
              variant="primary"
              onClick={() =>
                downloadFile(result.blob, `${source.file.name.replace(/\.[^.]+$/, '')}.${format}`, MIME[format])
              }
            >
              Download .{format}
            </Button>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-16 text-center text-sm text-faint">
            The converted image appears here.
          </p>
        )}
      </div>
    </div>
  );
}
