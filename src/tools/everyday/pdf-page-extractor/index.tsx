import { PDFDocument } from 'pdf-lib';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { pickFile } from '@/lib/files';

/** Parse "1-3, 5, 8-10" into zero-based indices, clamped to the document. */
function parseRanges(input: string, pageCount: number): number[] {
  const indices = new Set<number>();
  for (const part of input.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(trimmed);
    if (!match) throw new Error(`“${trimmed}” is not a page or range.`);
    const from = parseInt(match[1]!, 10);
    const to = match[2] ? parseInt(match[2], 10) : from;
    if (from < 1 || to < from) throw new Error(`Range “${trimmed}” is invalid.`);
    for (let page = from; page <= Math.min(to, pageCount); page++) indices.add(page - 1);
  }
  return [...indices].sort((a, b) => a - b);
}

export default function PdfPageExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selection, setSelection] = useState('1-3');
  const [status, setStatus] = useState<{ kind: 'error' | 'done' | 'busy'; message: string } | null>(null);

  const open = () =>
    void pickFile('application/pdf').then(async (picked) => {
      if (!picked) return;
      try {
        const doc = await PDFDocument.load(await picked.arrayBuffer(), { ignoreEncryption: true });
        setFile(picked);
        setPageCount(doc.getPageCount());
        setSelection(`1-${Math.min(3, doc.getPageCount())}`);
        setStatus(null);
      } catch {
        setStatus({ kind: 'error', message: 'Could not read that PDF — it may be encrypted or corrupt.' });
      }
    });

  const extract = async () => {
    if (!file) return;
    setStatus({ kind: 'busy', message: 'Extracting…' });
    try {
      const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const indices = parseRanges(selection, source.getPageCount());
      if (indices.length === 0) throw new Error('No pages selected.');
      const out = await PDFDocument.create();
      out.setProducer('LocalCraft (client-side)');
      const pages = await out.copyPages(source, indices);
      pages.forEach((page) => out.addPage(page));
      downloadFile(await out.save(), `${file.name.replace(/\.pdf$/i, '')}-extract.pdf`, 'application/pdf');
      setStatus({ kind: 'done', message: `Extracted ${indices.length} of ${source.getPageCount()} pages.` });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Extraction failed.' });
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <TitleBlock title="Source" />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => void open()}>
          Open PDF…
        </Button>
        {file ? (
          <span className="font-mono text-[12.5px] text-muted">
            {file.name} · {pageCount} pages
          </span>
        ) : null}
      </div>

      {file ? (
        <>
          <Field
            label="Pages to keep"
            htmlFor="pe-range"
            hint={`Ranges like 1-3, 5, 8-10 · this document has ${pageCount} pages.`}
          >
            <TextInput id="pe-range" value={selection} onChange={(e) => setSelection(e.target.value)} className="w-56! font-mono" />
          </Field>
          <Button variant="primary" onClick={() => void extract()} disabled={status?.kind === 'busy'}>
            Extract pages
          </Button>
        </>
      ) : (
        <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-12 text-center text-sm text-faint">
          Open a PDF to pull selected pages into a new file — everything stays in this tab.
        </p>
      )}

      {status ? (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted"
        >
          {status.kind === 'error' ? '✗ ' : '· '}
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
