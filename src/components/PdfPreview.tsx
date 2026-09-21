import { useEffect, useRef, useState } from 'react';

import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

let workerConfigured = false;

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    workerConfigured = true;
  }
  return pdfjs;
}

/**
 * Renders page previews of locally generated PDF bytes with pdf.js — loaded
 * lazily, so its weight stays out of the initial bundle.
 */
export function PdfPreview({ bytes, className }: { bytes: Uint8Array | null; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.round(entries[0]!.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [bytes]);

  useEffect(() => {
    if (!bytes || width === 0) return;
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    setRendering(true);
    setError(null);

    void (async () => {
      try {
        const pdfjs = await loadPdfjs();
        // pdf.js transfers the buffer it receives — hand it a copy each render.
        const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
        const doc = await loadingTask.promise;
        if (cancelled) {
          void loadingTask.destroy();
          return;
        }
        const pageNumber = Math.min(page, doc.numPages);
        setPageCount(doc.numPages);
        const pdfPage = await doc.getPage(pageNumber);
        if (cancelled) {
          void loadingTask.destroy();
          return;
        }
        const base = pdfPage.getViewport({ scale: 1 });
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const viewport = pdfPage.getViewport({ scale: (width / base.width) * dpr });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
        const renderTask = pdfPage.render({ canvas, canvasContext: ctx, viewport });
        task = renderTask;
        await renderTask.promise;
        void loadingTask.destroy();
      } catch (err) {
        // Cancelled renders land here too; only surface real failures.
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not render the preview.');
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [bytes, width, page]);

  return (
    <figure className={cn('flex flex-col', className)}>
      <div
        ref={containerRef}
        className="flex min-h-40 flex-1 items-start justify-center overflow-hidden rounded-md border border-line bg-raised p-3"
      >
        {error ? (
          <p className="mt-16 text-center text-sm text-muted">Preview failed: {error}</p>
        ) : (
          <canvas
            ref={canvasRef}
            role="img"
            aria-label="PDF preview"
            className={cn('block h-auto max-w-full shadow-[0_1px_8px_oklch(0.2_0.03_266_/_0.18)]', rendering && 'opacity-60')}
          />
        )}
        {!bytes && !error ? (
          <p className="mt-16 text-center text-sm text-faint">The preview appears here as you type.</p>
        ) : null}
      </div>
      {pageCount > 1 ? (
        <figcaption className="mt-2 flex items-center justify-center gap-3 font-mono text-[12px] text-muted">
          <Button variant="ghost" className="px-2 py-1" onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Previous page">
            ←
          </Button>
          page {page} / {pageCount}
          <Button variant="ghost" className="px-2 py-1" onClick={() => setPage((p) => Math.min(pageCount, p + 1))} aria-label="Next page">
            →
          </Button>
        </figcaption>
      ) : null}
    </figure>
  );
}
