import { useEffect, useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { toDateTimeLocalValue } from '@/lib/utils';

function toDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^-?\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    const ms = Math.abs(num) > 1e11 ? num : num * 1000; // seconds vs milliseconds
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function UnixTimestamp() {
  // Clock state starts on the client so prerendered HTML hydrates deterministically.
  const [now, setNow] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const stamp = Math.floor(Date.now() / 1000);
    setNow(stamp);
    setInput((current) => current || String(stamp));
    setDateTime((current) => current || toDateTimeLocalValue(new Date()));
    const timer = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const parsed = useMemo(() => toDate(input), [input]);
  const fromDateTime = useMemo(() => {
    const date = new Date(dateTime);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [dateTime]);

  return (
    <div className="max-w-3xl space-y-8">
      <section className="space-y-3">
        <TitleBlock title="Right now" />
        <div className="flex flex-wrap items-center gap-4 rounded-md border border-line bg-surface px-4 py-3 font-mono text-[15px] text-fg">
          <span className="text-2xl font-semibold tabular-nums">{now ?? '…'}</span>
          <span className="text-muted">seconds since epoch</span>
          {now !== null ? <CopyButton text={String(now)} label="" ariaLabel="Copy current timestamp" className="border-0 px-1.5" /> : null}
        </div>
        <p className="font-mono text-[12px] text-faint">
          {now !== null
            ? new Date(now * 1000).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' })
            : 'Starting the clock…'}
        </p>
      </section>

      <section className="space-y-3">
        <TitleBlock title="Timestamp → date" tone="pencil" />
        <Field label="Unix timestamp (seconds or milliseconds)" htmlFor="ts-in">
          <TextInput id="ts-in" value={input} onChange={(e) => setInput(e.target.value)} className="font-mono" />
        </Field>
        {parsed ? (
          <dl className="space-y-1.5 rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px]">
            {[
              ['ISO 8601 (UTC)', parsed.toISOString()],
              ['Local', parsed.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' })],
              ['Seconds', String(Math.floor(parsed.getTime() / 1000))],
              ['Milliseconds', String(parsed.getTime())],
              ['Relative', `${((Date.now() - parsed.getTime()) / 86400000).toFixed(1)} days ${Date.now() >= parsed.getTime() ? 'ago' : 'from now'}`],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2">
                <dt className="text-faint">{label}</dt>
                <dd className="text-fg">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-faint">Enter a timestamp to convert.</p>
        )}
      </section>

      <section className="space-y-3">
        <TitleBlock title="Date → timestamp" />
        <Field label="Date and time" htmlFor="ts-date">
          <TextInput id="ts-date" type="datetime-local" value={dateTime} onChange={(e) => setDateTime(e.target.value)} />
        </Field>
        {fromDateTime ? (
          <div className="flex flex-wrap items-center gap-3 font-mono text-[14px]">
            <span className="rounded-md border border-line bg-surface px-3 py-1.5 text-fg">{Math.floor(fromDateTime.getTime() / 1000)}</span>
            <CopyButton text={String(Math.floor(fromDateTime.getTime() / 1000))} label="Copy seconds" />
            <CopyButton text={String(fromDateTime.getTime())} label="Copy milliseconds" />
          </div>
        ) : null}
      </section>
    </div>
  );
}
