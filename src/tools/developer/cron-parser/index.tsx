import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, TextInput } from '@/components/ui/inputs';
import { Badge, TitleBlock } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import { CRON_FIELDS, describeCron, nextCronRuns } from './cron';

const PRESETS: { label: string; value: string }[] = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Hourly', value: '0 * * * *' },
  { label: 'Daily 09:00', value: '0 9 * * *' },
  { label: 'Weekdays 09:00', value: '0 9 * * 1-5' },
  { label: '1st of month', value: '0 0 1 * *' },
];

export default function CronParser() {
  const [expression, setExpression] = useState('0 9 * * 1-5');

  const result = useMemo(() => {
    const fields = expression.trim().split(/\s+/);
    if (fields.length !== 5) return { error: 'A cron expression has five fields: minute hour day-of-month month day-of-week.' };
    try {
      return { description: describeCron(fields), runs: nextCronRuns(fields) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Invalid expression.' };
    }
  }, [expression]);

  return (
    <div className="max-w-3xl space-y-6">
      <TitleBlock title="Expression" />
      <Field label="Cron expression" htmlFor="cron-in">
        <TextInput id="cron-in" value={expression} onChange={(e) => setExpression(e.target.value)} className="font-mono text-[15px]" spellCheck={false} />
      </Field>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            aria-pressed={expression === preset.value}
            onClick={() => setExpression(preset.value)}
            className={cn(
              'cursor-pointer rounded-md border px-3 py-1.5 text-[13px] transition-colors',
              expression === preset.value
                ? 'border-ink/30 bg-ink-tint text-ink'
                : 'border-line bg-surface text-muted hover:text-fg',
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="space-y-1 rounded-md border border-line bg-raised/50 p-4 font-mono text-[12.5px]">
        {CRON_FIELDS.map((field, i) => (
          <div key={field.label} className="flex justify-between gap-4">
            <span className="text-faint">{expression.trim().split(/\s+/)[i] ?? '—'}</span>
            <span className="text-muted">{field.label}</span>
          </div>
        ))}
      </div>

      {result && 'error' in result ? (
        <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
          ✗ {result.error}
        </p>
      ) : result ? (
        <>
          <div className="flex items-center gap-3">
            <Badge tone="ink">schedule</Badge>
            <p className="text-[15px] text-fg">{result.description}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <TitleBlock title="Next runs" tone="pencil" />
              {result.runs.length > 0 ? (
                <CopyButton text={result.runs.map((d) => d.toISOString()).join('\n')} label="Copy ISO" />
              ) : null}
            </div>
            {result.runs.length > 0 ? (
              <ul className="space-y-1 rounded-md border border-line bg-surface p-3 font-mono text-[13px] text-fg">
                {result.runs.map((date) => (
                  <li key={date.toISOString()}>{date.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</li>
                ))}
              </ul>
            ) : (
              <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-8 text-center text-sm text-faint">
                Nothing runs in the next 12 months — check the day/month combination.
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
