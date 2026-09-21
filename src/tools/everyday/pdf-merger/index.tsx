import { PDFDocument } from 'pdf-lib';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';
import { pickFiles } from '@/lib/files';

interface Entry {
  file: File;
  pages: number | null;
}

export default function PdfMerger() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<{ kind: 'busy' | 'error' | 'done'; message: string } | null>(null);

  const addFiles = async (files: File[]) => {
    const pdfs = files.filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) {
      setStatus({ kind: 'error', message: 'Those are not PDF files.' });
      return;
    }
    setStatus({ kind: 'busy', message: 'Reading page counts…' });
    const withPages: Entry[] = [];
    for (const file of pdfs) {
      try {
        const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
        withPages.push({ file, pages: doc.getPageCount() });
      } catch {
        withPages.push({ file, pages: null });
      }
    }
    setEntries((current) => [...current, ...withPages]);
    setStatus(null);
  };

  const move = (index: number, delta: number) =>
    setEntries((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const merge = async () => {
    setStatus({ kind: 'busy', message: 'Merging…' });
    try {
      const merged = await PDFDocument.create();
      merged.setProducer('LocalCraft (client-side)');
      for (const entry of entries) {
        const doc = await PDFDocument.load(await entry.file.arrayBuffer(), { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      }
      const bytes = await merged.save();
      downloadFile(bytes, 'merged.pdf', 'application/pdf');
      setStatus({ kind: 'done', message: `Merged ${entries.length} files into ${merged.getPageCount()} pages.` });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Merge failed — one of the files may be protected.' });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <TitleBlock title="Files" />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void pickFiles('application/pdf').then(addFiles)}>
          Add PDFs…
        </Button>
        <Button variant="primary" disabled={entries.length < 2 || status?.kind === 'busy'} onClick={() => void merge()}>
          Merge {entries.length >= 2 ? `${entries.length} files` : ''}
        </Button>
        {entries.length > 0 ? (
          <Button variant="ghost" onClick={() => setEntries([])}>
            Clear
          </Button>
        ) : null}
      </div>
      {status ? (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted"
        >
          {status.kind === 'error' ? '✗ ' : '· '}
          {status.message}
        </p>
      ) : null}

      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-12 text-center text-sm text-faint">
          Add two or more PDFs — they are merged in this tab, in the listed order.
        </p>
      ) : (
        <ol className="space-y-2">
          {entries.map((entry, index) => (
            <li key={`${entry.file.name}-${index}`} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
              <span className="w-6 font-mono text-[12px] text-faint">{index + 1}.</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] text-fg">{entry.file.name}</span>
                <span className="font-mono text-[11px] text-faint">
                  {formatBytes(entry.file.size)}
                  {entry.pages !== null ? ` · ${entry.pages} pages` : ''}
                </span>
              </span>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up" className="cursor-pointer rounded px-1.5 text-faint hover:text-fg disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === entries.length - 1} aria-label="Move down" className="cursor-pointer rounded px-1.5 text-faint hover:text-fg disabled:opacity-30">
                ↓
              </button>
              <button type="button" onClick={() => setEntries((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${entry.file.name}`} className="cursor-pointer rounded px-1.5 text-faint hover:text-fg">
                ✕
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
