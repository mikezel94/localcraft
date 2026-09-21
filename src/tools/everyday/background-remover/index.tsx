import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';
import { pickFile } from '@/lib/files';

/**
 * Client-side AI cutout via @imgly/background-removal (ONNX/WebAssembly, in-page).
 * The model blob (~40 MB) is fetched from the vendor CDN on first use and then
 * browser-cached; the image itself never leaves this tab.
 */
export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress('Loading the on-device model…');
    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          setProgress(total > 0 ? `${key.replace(/^[^/]+\//, '')} — ${Math.round((current / total) * 100)}%` : key);
        },
        output: { format: 'image/png' },
      });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setProgress(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Cutout failed: ${err.message}. The one-time model download needs a network connection.`
          : 'Cutout failed.',
      );
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <TitleBlock title="Photo" />
        <Button
          onClick={() =>
            void pickFile('image/*').then((picked) => {
              if (!picked) return;
              setFile(picked);
              setPreviewUrl(URL.createObjectURL(picked));
              setResultUrl(null);
              setResultBlob(null);
              setError(null);
            })
          }
        >
          Open image…
        </Button>
        {file ? <p className="font-mono text-[12.5px] text-muted">{file.name} · {formatBytes(file.size)}</p> : null}

        <Button variant="primary" disabled={!file || busy} onClick={() => void run()}>
          {busy ? 'Working…' : 'Remove background'}
        </Button>
        {progress ? <p className="font-mono text-[12px] text-muted">{progress}</p> : null}
        {error ? (
          <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
            ✗ {error}
          </p>
        ) : null}
        <p className="text-xs leading-snug text-faint">
          The cutout model (about 40 MB) downloads once from a CDN and is cached by your browser; after that it
          works offline. Your photo is processed on this machine and is never uploaded.
        </p>
      </div>

      <div className="space-y-4">
        <TitleBlock title="Result" tone="pencil" />
        {resultUrl && previewUrl ? (
          <>
            <div
              className="flex items-center justify-center rounded-md border border-line p-4"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, var(--line) 25%, transparent 25%), linear-gradient(-45deg, var(--line) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--line) 75%), linear-gradient(-45deg, transparent 75%, var(--line) 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
              }}
            >
              <img src={resultUrl} alt="Cutout result" className="max-h-96 object-contain" />
            </div>
            <Button
              variant="primary"
              disabled={!resultBlob}
              onClick={() => resultBlob && downloadFile(resultBlob, (file?.name ?? 'cutout').replace(/\.[^.]+$/, '') + '-cutout.png', 'image/png')}
            >
              Download PNG
            </Button>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-16 text-center text-sm text-faint">
            The transparent cutout appears here.
          </p>
        )}
      </div>
    </div>
  );
}
