import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Checkbox, Field, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';

const SAMPLE = `postgres
redis
postgres
nginx
redis
minio
nginx
postgres`;

export default function DuplicateRemover() {
  const [input, setInput] = useState(SAMPLE);
  const [trim, setTrim] = useState(true);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [sort, setSort] = useState(false);

  const result = useMemo(() => {
    const lines = input.split('\n').filter((line, index, all) => !(line === '' && index === all.length - 1));
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const line of lines) {
      const key = (trim ? line.trim() : line) || line;
      const needle = ignoreCase ? key.toLowerCase() : key;
      if (seen.has(needle)) continue;
      seen.add(needle);
      unique.push(key);
    }
    return { original: lines.length, unique, removed: lines.length - unique.length };
  }, [input, trim, ignoreCase, sort]);

  const output = (sort ? [...result.unique].sort((a, b) => a.localeCompare(b)) : result.unique).join('\n');

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="Input" />
        <Field label="Lines" htmlFor="dup-in">
          <TextArea id="dup-in" value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64 font-mono text-[13px]" spellCheck={false} />
        </Field>
        <div className="flex flex-wrap gap-5">
          <Checkbox label="Trim lines" checked={trim} onChange={setTrim} />
          <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
          <Checkbox label="Sort A→Z" checked={sort} onChange={setSort} />
        </div>
        <p className="font-mono text-[12px] text-muted">
          {result.original} lines in · {result.unique} unique · <span className="text-ink">{result.removed} removed</span>
        </p>
      </div>
      <div className="space-y-4">
        <TitleBlock title="Unique lines" tone="pencil" />
        <TextArea value={output} readOnly aria-label="Unique lines" className="min-h-64 font-mono text-[13px]" spellCheck={false} />
        <CopyButton text={output} />
      </div>
    </div>
  );
}
