import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Field, Select, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { SearchablePre } from '@/components/SearchablePre';
import { highlightJson as highlight } from '@/lib/highlight';
import { downloadFile } from '@/lib/utils';

const SAMPLE = `{"name":"LocalCraft","version":2,"private":true,"tools":["json","sql","csv"],"meta":{"bytes":null,"stars":4.8}}`;

function describeError(error: unknown, input: string): string | null {
  if (!(error instanceof Error)) return 'Invalid JSON.';
  const match = /position (\d+)/.exec(error.message);
  if (!match) return error.message;
  const position = Math.min(parseInt(match[1]!, 10), input.length - 1);
  const before = input.slice(0, position);
  const line = before.split('\n').length;
  const column = position - before.lastIndexOf('\n');
  return `${error.message.replace(/ in JSON at position \d+/, '')} — line ${line}, column ${column}`;
}

export default function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState('2');
  const [result, setResult] = useState<{ ok: boolean; text: string; error?: string } | null>(null);

  const indentValue = indent === 'tab' ? '\t' : parseInt(indent, 10);
  const output = useMemo(() => result?.ok ? result.text : '', [result]);

  const run = (minify: boolean) => {
    try {
      const parsed = JSON.parse(input) as unknown;
      const text = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indentValue);
      setResult({ ok: true, text });
    } catch (error) {
      setResult({ ok: false, text: '', error: describeError(error, input) ?? 'Invalid JSON.' });
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="Input" />
        <Field label="JSON" htmlFor="jf-in">
          <TextArea
            id="jf-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-72 font-mono text-[13px]"
            spellCheck={false}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" onClick={() => run(false)}>
            Format
          </Button>
          <Button onClick={() => run(true)}>Minify</Button>
          <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="w-28!" aria-label="Indent">
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tabs</option>
          </Select>
        </div>
        {result && !result.ok ? (
          <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
            ✗ {result.error}
          </p>
        ) : null}
        {result?.ok ? (
          <p className="font-mono text-[12px] text-faint">✓ valid JSON · {result.text.length.toLocaleString()} characters</p>
        ) : null}
      </div>

      <div className="space-y-4">
        <TitleBlock title="Output" />
        {output ? (
          <>
            <SearchablePre text={output} highlight={highlight} label="Formatted JSON" />
            <div className="flex gap-2">
              <CopyButton text={output} />
              <Button onClick={() => downloadFile(output, 'formatted.json', 'application/json')}>Download</Button>
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
            Formatted JSON appears here.
          </p>
        )}
      </div>
    </div>
  );
}
