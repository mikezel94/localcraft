import { useMemo, useState } from 'react';

import { Field, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { formatMoney } from '@/lib/utils';

export default function LoanCalculator() {
  const [amount, setAmount] = useState('320000');
  const [annualRate, setAnnualRate] = useState('5.4');
  const [years, setYears] = useState('25');
  const [extra, setExtra] = useState('0');

  const schedule = useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const monthlyRate = (parseFloat(annualRate) || 0) / 100 / 12;
    const months = Math.max(1, Math.round((parseFloat(years) || 1) * 12));
    const extraMonthly = Math.max(0, parseFloat(extra) || 0);

    const base =
      monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

    const rows: { month: number; payment: number; interest: number; principal: number; balance: number }[] = [];
    let balance = principal;
    let totalInterest = 0;
    let month = 0;
    while (balance > 0.005 && month < months + 600) {
      month += 1;
      const interest = balance * monthlyRate;
      const payment = Math.min(base + extraMonthly, balance + interest);
      const principalPart = payment - interest;
      balance = Math.max(0, balance - principalPart);
      totalInterest += interest;
      rows.push({ month, payment, interest, principal: principalPart, balance });
    }
    return { rows, base, totalInterest, months: rows.length, total: principal + totalInterest };
  }, [amount, annualRate, years, extra]);

  const currency = '$';
  const yearsToPayoff = (schedule.months / 12).toFixed(1);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
      <div className="space-y-6">
        <TitleBlock title="Loan" />
        <Field label="Amount" htmlFor="ln-amount">
          <TextInput id="ln-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-right" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rate (% / year)" htmlFor="ln-rate">
            <TextInput id="ln-rate" inputMode="decimal" value={annualRate} onChange={(e) => setAnnualRate(e.target.value)} className="text-right" />
          </Field>
          <Field label="Term (years)" htmlFor="ln-years">
            <TextInput id="ln-years" type="number" min={1} max={40} value={years} onChange={(e) => setYears(e.target.value)} className="text-right" />
          </Field>
        </div>
        <Field label="Extra payment / month" htmlFor="ln-extra" hint="Any overpayment shortens the loan and cuts interest.">
          <TextInput id="ln-extra" inputMode="decimal" value={extra} onChange={(e) => setExtra(e.target.value)} className="text-right" />
        </Field>

        <dl className="space-y-2 rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px] text-muted">
          <div className="flex justify-between">
            <dt>Scheduled payment</dt>
            <dd className="text-fg">{formatMoney(schedule.base, currency)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Paid off in</dt>
            <dd className="text-fg">{yearsToPayoff} years ({schedule.months} months)</dd>
          </div>
          <div className="flex justify-between">
            <dt>Total interest</dt>
            <dd className="text-fg">{formatMoney(schedule.totalInterest, currency)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-[14px] font-semibold text-fg">
            <dt>Total paid</dt>
            <dd>{formatMoney(schedule.total, currency)}</dd>
          </div>
        </dl>
      </div>

      <div className="min-w-0 space-y-3">
        <TitleBlock title="Amortization" tone="pencil" note={`${schedule.months} months`} />
        <div className="max-h-[32rem] overflow-auto rounded-md border border-line">
          <table className="w-full border-collapse text-right font-mono text-[12px]">
            <caption className="sr-only">Amortization schedule by month</caption>
            <thead className="sticky top-0 bg-raised text-faint">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 font-medium">Payment</th>
                <th className="px-3 py-2 font-medium">Interest</th>
                <th className="px-3 py-2 font-medium">Principal</th>
                <th className="px-3 py-2 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.rows.map((row) => (
                <tr key={row.month} className="border-t border-line text-muted odd:bg-surface">
                  <td className="px-3 py-1.5 text-left text-faint">{row.month}</td>
                  <td className="px-3 py-1.5">{formatMoney(row.payment, currency)}</td>
                  <td className="px-3 py-1.5 text-ink">{formatMoney(row.interest, currency)}</td>
                  <td className="px-3 py-1.5 text-pencil">{formatMoney(row.principal, currency)}</td>
                  <td className="px-3 py-1.5 text-fg">{formatMoney(row.balance, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
