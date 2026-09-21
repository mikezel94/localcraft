import { ArrowLeftRight } from 'lucide-react';
import { diffLines } from 'diff';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox, Field, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';

const OLD_SAMPLE = `function total(items) {
  let sum = 0;
  for (const item of items) {
    sum = sum + item.price;
  }
  return sum;
}`;

const NEW_SAMPLE = `function total(items) {
  let sum = 0;
  for (const item of items) {
    sum += item.price * item.qty;
  }
  return sum;
}`;

interface Row {
  type: 'added' | 'removed' | 'same';
  text: string;
}

export default function DiffChecker() {
  const [oldText, setOldText] = useState(OLD_SAMPLE);
  const [newText, setNewText] = useState(NEW_SAMPLE);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const normalize = (line: string): string => {
      let value = line;
      if (ignoreWhitespace) value = value.trim();
      if (ignoreCase) value = value.toLowerCase();
      return value;
    };
    const parts = diffLines(oldText, newText, {
      newlineIsToken: false,
      ...(ignoreCase || ignoreWhitespace
        ? { comparator: (a: string, b: string) => normalize(a) === normalize(b) }
        : {}),
    });
    return parts.flatMap((part) => {
      const lines = part.value.split('\n');
      if (lines[lines.length - 1] === '') lines.pop(); // drop trailing newline artifact
      return lines.map((line) => ({
        type: part.added ? ('added' as const) : part.removed ? ('removed' as const) : ('same' as const),
        text: line,
      }));
    });
  }, [oldText, newText, ignoreCase, ignoreWhitespace]);

  const added = rows.filter((row) => row.type === 'added').length;
  const removed = rows.filter((row) => row.type === 'removed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setOldText(newText);
            setNewText(oldText);
          }}
          aria-label="Swap original and changed text"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
          Swap sides
        </Button>
        <Button variant="ghost" onClick={() => {
          setOldText('');
          setNewText('');
        }}>
          Clear both
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <TitleBlock title="Original" />
          <Field label="Original text" htmlFor="diff-old">
            <TextArea
              id="diff-old"
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              spellCheck={false}
              className="min-h-56 font-mono text-[13px]"
            />
          </Field>
        </div>
        <div className="space-y-4">
          <TitleBlock title="Changed" tone="pencil" />
          <Field label="Changed text" htmlFor="diff-new">
            <TextArea
              id="diff-new"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              spellCheck={false}
              className="min-h-56 font-mono text-[13px]"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <Checkbox label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
        <Checkbox label="Ignore whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
        <span className="font-mono text-[12px] text-muted" aria-live="polite">
          <span className="text-pencil">+{added}</span> · <span className="text-ink">−{removed}</span>
        </span>
      </div>

      {oldText || newText ? (
        <div className="overflow-hidden rounded-md border border-line">
          {rows.map((row, index) => (
            <div
              key={index}
              className={
                row.type === 'added'
                  ? 'bg-pencil-soft/70 px-4 py-0.5 font-mono text-[13px] text-fg'
                  : row.type === 'removed'
                    ? 'bg-ink-soft/70 px-4 py-0.5 font-mono text-[13px] text-fg'
                    : 'px-4 py-0.5 font-mono text-[13px] text-muted'
              }
            >
              <span className="mr-3 inline-block w-3 select-none text-faint">
                {row.type === 'added' ? '+' : row.type === 'removed' ? '−' : ''}
              </span>
              <span className="whitespace-pre-wrap break-all">{row.text || ' '}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
          Paste two versions above to compare them line by line.
        </p>
      )}
    </div>
  );
}
