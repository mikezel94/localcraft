import { Dices } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, Segmented, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function uuidV4(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function ulid(): string {
  let time = Date.now();
  let out = '';
  for (let i = 0; i < 10; i++) {
    out = CROCKFORD[time % 32] + out;
    time = Math.floor(time / 32);
  }
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let acc = 0;
  let bits = 0;
  let next = 0;
  for (let i = 0; i < 16; i++) {
    while (bits < 5) {
      acc = ((acc << 8) & 0xffffffff) | bytes[next++ % bytes.length]!;
      bits += 8;
    }
    out += CROCKFORD[(acc >>> (bits - 5)) & 31];
    bits -= 5;
  }
  return out;
}

export default function UuidGenerator() {
  const [format, setFormat] = useState<'v4' | 'ulid'>('v4');
  const [count, setCount] = useState('5');
  // Generated on the client after mount so prerendered HTML hydrates deterministically.
  const [results, setResults] = useState<string[]>([]);

  const generate = () => {
    const n = Math.max(1, Math.min(100, parseInt(count) || 1));
    const make = format === 'v4' ? uuidV4 : ulid;
    setResults(Array.from({ length: n }, make));
  };

  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <TitleBlock title="Identifiers" />
      <div className="flex flex-wrap items-end gap-3">
        <Segmented
          ariaLabel="Identifier format"
          options={[
            { value: 'v4', label: 'UUID v4' },
            { value: 'ulid', label: 'ULID' },
          ]}
          value={format}
          onChange={setFormat}
          className="w-44!"
        />
        <Field label="How many" htmlFor="uuid-count">
          <TextInput
            id="uuid-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-24! text-right"
          />
        </Field>
        <Button variant="primary" onClick={generate}>
          <Dices className="size-4" aria-hidden />
          Generate
        </Button>
        <CopyButton text={results.join('\n')} label="Copy all" />
      </div>

      {results.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
          Identifiers appear here.
        </p>
      ) : null}
      <ul className="space-y-1.5">
        {results.map((value, index) => (
          <li
            key={`${value}-${index}`}
            className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 font-mono text-[13px] text-fg"
          >
            <span className="min-w-0 flex-1 break-all">{value}</span>
            <CopyButton text={value} label="" ariaLabel={`Copy ${value}`} className="shrink-0 border-0 px-1.5" />
          </li>
        ))}
      </ul>
      <p className="text-xs leading-snug text-faint">
        {format === 'v4'
          ? 'UUID v4 comes from crypto.getRandomValues — 122 random bits per identifier.'
          : 'ULIDs are time-sortable: 48-bit timestamp + 80 random bits, Crockford base32.'}
      </p>
    </div>
  );
}
