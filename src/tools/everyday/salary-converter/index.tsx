import { useMemo, useState } from 'react';

import { Field, Segmented, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { formatMoney } from '@/lib/utils';

type Unit = 'annual' | 'monthly' | 'weekly' | 'daily' | 'hourly';

export default function SalaryConverter() {
  const [amount, setAmount] = useState('72000');
  const [unit, setUnit] = useState<Unit>('annual');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [weeksPerYear, setWeeksPerYear] = useState('48'); // 52 minus time off

  const equivalent = useMemo(() => {
    const value = parseFloat(amount) || 0;
    const hours = Math.max(1, parseFloat(hoursPerWeek) || 40);
    const weeks = Math.max(1, parseFloat(weeksPerYear) || 52);
    const annual =
      unit === 'annual' ? value : unit === 'monthly' ? value * 12 : unit === 'weekly' ? value * weeks : unit === 'daily' ? value * (weeks * 5) : value * hours * weeks;
    return {
      annual,
      monthly: annual / 12,
      weekly: annual / weeks,
      daily: annual / (weeks * 5),
      hourly: annual / (hours * weeks),
    };
  }, [amount, unit, hoursPerWeek, weeksPerYear]);

  const rows: [string, number][] = [
    ['Per year', equivalent.annual],
    ['Per month', equivalent.monthly],
    ['Per week', equivalent.weekly],
    ['Per day (5-day week)', equivalent.daily],
    ['Per hour', equivalent.hourly],
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <TitleBlock title="Your number" />
        <Field label="Amount" htmlFor="sl-amount">
          <TextInput id="sl-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-right text-[16px]" />
        </Field>
        <Field label="This amount is…">
          <Segmented
            ariaLabel="Unit"
            options={[
              { value: 'annual', label: '/ year' },
              { value: 'monthly', label: '/ month' },
              { value: 'weekly', label: '/ week' },
              { value: 'daily', label: '/ day' },
              { value: 'hourly', label: '/ hour' },
            ]}
            value={unit}
            onChange={setUnit}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours / week" htmlFor="sl-hours">
            <TextInput id="sl-hours" type="number" min={1} max={80} value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="text-right" />
          </Field>
          <Field label="Paid weeks / year" htmlFor="sl-weeks" hint="52 minus vacation and holidays.">
            <TextInput id="sl-weeks" type="number" min={1} max={52} value={weeksPerYear} onChange={(e) => setWeeksPerYear(e.target.value)} className="text-right" />
          </Field>
        </div>
      </div>

      <div className="space-y-3">
        <TitleBlock title="Equivalents" tone="pencil" />
        <ul className="space-y-2">
          {rows.map(([label, value]) => (
            <li
              key={label}
              className={`flex items-baseline justify-between rounded-md border px-4 py-3 ${
                label === 'Per hour' ? 'border-ink/25 bg-ink-tint' : 'border-line bg-surface'
              }`}
            >
              <span className="text-[14px] text-muted">{label}</span>
              <span className={`font-mono ${label === 'Per hour' ? 'text-[18px] font-semibold text-ink' : 'text-[16px] text-fg'}`}>
                {formatMoney(value, '$')}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-snug text-faint">
          Gross figures before tax — every number recomputes locally as you type.
        </p>
      </div>
    </div>
  );
}
