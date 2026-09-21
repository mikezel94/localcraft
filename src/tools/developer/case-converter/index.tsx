import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';

function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
}

const CONVERSIONS: { label: string; convert: (text: string) => string }[] = [
  { label: 'camelCase', convert: (t) => words(t).map((w, i) => (i === 0 ? w.toLowerCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase())).join('') },
  { label: 'PascalCase', convert: (t) => words(t).map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase()).join('') },
  { label: 'snake_case', convert: (t) => words(t).map((w) => w.toLowerCase()).join('_') },
  { label: 'kebab-case', convert: (t) => words(t).map((w) => w.toLowerCase()).join('-') },
  { label: 'CONSTANT_CASE', convert: (t) => words(t).map((w) => w.toUpperCase()).join('_') },
  { label: 'Title Case', convert: (t) => words(t).map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase()).join(' ') },
  { label: 'Sentence case', convert: (t) => words(t).map((w) => w.toLowerCase()).join(' ').replace(/^./, (c) => c.toUpperCase()) },
  { label: 'UPPER CASE', convert: (t) => words(t).map((w) => w.toUpperCase()).join(' ') },
  { label: 'lower case', convert: (t) => words(t).map((w) => w.toLowerCase()).join(' ') },
];

export default function CaseConverter() {
  const [input, setInput] = useState('receipt invoice generator');

  const results = useMemo(
    () => CONVERSIONS.map(({ label, convert }) => ({ label, value: convert(input) })),
    [input],
  );

  return (
    <div className="max-w-3xl space-y-6">
      <TitleBlock title="Input" />
      <Field label="Text" htmlFor="case-in">
        <TextArea id="case-in" value={input} onChange={(e) => setInput(e.target.value)} className="min-h-20" />
      </Field>

      <div className="flex items-center justify-between">
        <TitleBlock title="Conversions" tone="pencil" />
        <CopyButton text={results.map(({ value }) => value).join('\n')} label="Copy all" />
      </div>
      <ul className="space-y-2">
        {results.map(({ label, value }) => (
          <li key={label} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
            <span className="w-32 shrink-0 font-mono text-[12px] text-faint">{label}</span>
            <span className="min-w-0 flex-1 break-all font-mono text-[13px] text-fg">{value}</span>
            <CopyButton text={value} label="" ariaLabel={`Copy ${label}`} className="shrink-0 border-0 px-1.5" />
          </li>
        ))}
      </ul>
    </div>
  );
}
