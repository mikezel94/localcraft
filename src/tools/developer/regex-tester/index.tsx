import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, TextArea, TextInput } from '@/components/ui/inputs';
import { Badge, TitleBlock } from '@/components/ui/misc';
import { highlightSegments, runRegex, tryRegex } from './regex';

const SAMPLE_TEXT = `Contact marti@example.com or ship to 14 Harbour Lane, Portland.
Order #R-1042 shipped 2026-09-17. Backup order: R-1043 (delayed).`;

export default function RegexTester() {
  const [pattern, setPattern] = useState('R-\\d{4}|[\\w.+-]+@[\\w-]+\\.[\\w.]+');
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [text, setText] = useState(SAMPLE_TEXT);
  const [replacement, setReplacement] = useState('');

  const flagString = Object.entries(flags)
    .filter(([, on]) => on)
    .map(([flag]) => flag)
    .join('');

  const result = useMemo(() => runRegex(pattern, flagString, text), [pattern, flagString, text]);
  // Guarded: an invalid pattern must not throw during render when a replacement is typed.
  const replaceRegex = result.error ? null : tryRegex(pattern, flagString);
  const replaced = replaceRegex ? text.replace(replaceRegex, replacement) : '';

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="Pattern" />
        <Field label="Regular expression" htmlFor="re-pattern">
          <TextInput
            id="re-pattern"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="font-mono text-[13px]"
            spellCheck={false}
          />
        </Field>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(flags) as (keyof typeof flags)[]).map((flag) => (
            <label key={flag} className="flex cursor-pointer items-center gap-1.5 font-mono text-[13px] text-fg">
              <input
                type="checkbox"
                checked={flags[flag]}
                onChange={(e) => setFlags((f) => ({ ...f, [flag]: e.target.checked }))}
                className="size-3.5 cursor-pointer accent-[var(--ink)]"
              />
              {flag}
            </label>
          ))}
        </div>
        <Field label="Test text" htmlFor="re-text">
          <TextArea id="re-text" value={text} onChange={(e) => setText(e.target.value)} className="min-h-40 font-mono text-[13px]" spellCheck={false} />
        </Field>
        <Field label="Replace with (optional)" htmlFor="re-repl">
          <TextInput id="re-repl" value={replacement} onChange={(e) => setReplacement(e.target.value)} className="font-mono text-[13px]" spellCheck={false} />
        </Field>
        {result.error ? (
          <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
            ✗ {result.error}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <TitleBlock title="Matches" tone="pencil" />
          {!result.error ? <Badge tone="pencil">{result.matches.length} matches</Badge> : null}
        </div>
        <p
          aria-label="Text with matches highlighted"
          className="min-h-24 whitespace-pre-wrap break-words rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px] leading-relaxed text-fg"
        >
          {highlightSegments(text, result.matches).map((segment, i) =>
            segment.hit ? (
              <mark key={i} className="rounded-[3px] bg-highlight/60 px-0.5 text-fg">
                {segment.text}
              </mark>
            ) : (
              <span key={i}>{segment.text}</span>
            ),
          )}
        </p>
        {result.matches.length > 0 ? (
          <ul className="max-h-52 space-y-1 overflow-auto rounded-md border border-line bg-surface p-2 font-mono text-[12.5px]">
            {result.matches.slice(0, 100).map((match, i) => (
              <li key={i} className="flex gap-3 px-1 py-0.5">
                <span className="w-10 shrink-0 text-faint">@{match.index}</span>
                <span className="min-w-0 flex-1 break-all text-fg">{match.text}</span>
                {match.groups.length > 0 ? (
                  <span className="shrink-0 text-muted">
                    groups: {match.groups.map((g) => `(${g ?? '—'})`).join(' ')}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {replacement && !result.error ? (
          <div className="space-y-2">
            <p className="font-mono text-[11px] text-faint">after replace</p>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-raised/50 p-3 font-mono text-[12.5px] text-fg">{replaced}</pre>
            <CopyButton text={replaced} label="Copy result" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
