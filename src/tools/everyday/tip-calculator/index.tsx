import { useMemo, useState } from 'react';

import { Field, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { cn, formatMoney } from '@/lib/utils';

const PRESETS = [0, 10, 15, 18, 20, 25];

export default function TipCalculator() {
  const [bill, setBill] = useState('84.50');
  const [tipPercent, setTipPercent] = useState('18');
  const [people, setPeople] = useState('3');
  const [roundUp, setRoundUp] = useState(true);

  const result = useMemo(() => {
    const base = parseFloat(bill) || 0;
    const tip = base * ((parseFloat(tipPercent) || 0) / 100);
    const count = Math.max(1, Math.round(parseInt(people) || 1));
    let total = base + tip;
    let perPerson = total / count;
    if (roundUp) perPerson = Math.ceil(perPerson);
    total = perPerson * count;
    const effectiveTip = total - base;
    return {
      base,
      tip,
      count,
      perPerson,
      total,
      effectiveTip,
      effectivePercent: base > 0 ? (effectiveTip / base) * 100 : 0,
    };
  }, [bill, tipPercent, people, roundUp]);

  return (
    <div className="grid max-w-4xl gap-8 sm:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <TitleBlock title="Bill" />
        <Field label="Bill amount" htmlFor="tip-bill">
          <TextInput id="tip-bill" inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value)} className="text-right text-[16px]" />
        </Field>
        <Field label="Tip">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={tipPercent === String(preset)}
                onClick={() => setTipPercent(String(preset))}
                className={cn(
                  'cursor-pointer rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors',
                  tipPercent === String(preset)
                    ? 'border-ink/30 bg-ink-tint text-ink'
                    : 'border-line bg-surface text-muted hover:text-fg',
                )}
              >
                {preset === 0 ? 'No tip' : `${preset}%`}
              </button>
            ))}
            <TextInput
              aria-label="Custom tip percent"
              inputMode="decimal"
              value={tipPercent}
              onChange={(e) => setTipPercent(e.target.value)}
              className="w-20! text-right"
            />
          </div>
        </Field>
        <Field label="Split between" htmlFor="tip-people">
          <TextInput id="tip-people" type="number" min={1} max={50} value={people} onChange={(e) => setPeople(e.target.value)} className="w-24! text-right" />
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg">
          <input type="checkbox" checked={roundUp} onChange={(e) => setRoundUp(e.target.checked)} className="size-4 cursor-pointer accent-[var(--ink)]" />
          Round each share up to a whole amount
        </label>
      </div>

      <div className="space-y-4">
        <div className="rounded-md border border-ink/25 bg-ink-tint p-6">
          <p className="font-mono text-[11px] text-faint">each person pays</p>
          <p className="font-display text-[44px] font-semibold leading-tight text-fg">{formatMoney(result.perPerson, '$')}</p>
          <p className="mt-1 font-mono text-[12.5px] text-muted">
            {result.count} {result.count === 1 ? 'person' : 'people'} · total {formatMoney(result.total, '$')}
          </p>
        </div>
        <dl className="space-y-1.5 rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px] text-muted">
          <div className="flex justify-between">
            <dt>Bill</dt>
            <dd>{formatMoney(result.base, '$')}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Effective tip ({result.effectivePercent.toFixed(1)}%)</dt>
            <dd>{formatMoney(result.effectiveTip, '$')}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
