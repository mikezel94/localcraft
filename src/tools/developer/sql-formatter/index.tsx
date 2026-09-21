import { format } from 'sql-formatter';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, Select, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { SearchablePre } from '@/components/SearchablePre';

const DIALECTS = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'transactsql', label: 'T-SQL' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'snowflake', label: 'Snowflake' },
] as const;

const SAMPLE = 'select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.created_at > \'2026-01-01\' group by 1, 2 having count(o.id) > 3 order by orders desc limit 20;';

export default function SqlFormatter() {
  const [input, setInput] = useState(SAMPLE);
  const [dialect, setDialect] = useState<string>('postgresql');
  const [keywordCase, setKeywordCase] = useState<'preserve' | 'upper' | 'lower'>('upper');

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, text: '' };
    try {
      const text = format(input, {
        language: dialect as (typeof DIALECTS)[number]['value'],
        keywordCase,
        tabWidth: 2,
      });
      return { ok: true as const, text };
    } catch (error) {
      return { ok: false as const, text: '', error: error instanceof Error ? error.message : 'Could not parse that SQL.' };
    }
  }, [input, dialect, keywordCase]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="Query" />
        <Field label="SQL" htmlFor="sf-in">
          <TextArea
            id="sf-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-72 font-mono text-[13px]"
            spellCheck={false}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dialect" htmlFor="sf-dialect">
            <Select id="sf-dialect" value={dialect} onChange={(e) => setDialect(e.target.value)}>
              {DIALECTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Keywords" htmlFor="sf-case">
            <Select
              id="sf-case"
              value={keywordCase}
              onChange={(e) => setKeywordCase(e.target.value as 'preserve' | 'upper' | 'lower')}
            >
              <option value="upper">UPPERCASE</option>
              <option value="lower">lowercase</option>
              <option value="preserve">preserve</option>
            </Select>
          </Field>
        </div>
        {result.ok ? null : (
          <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
            ✗ {result.error}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <TitleBlock title="Formatted" />
        {result.ok && result.text ? (
          <>
            <SearchablePre text={result.text} label="Formatted SQL" />
            <div className="flex gap-2">
              <CopyButton text={result.text} />
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
            {result.ok ? 'Formatted SQL appears here.' : 'Fix the query to see the formatted result.'}
          </p>
        )}
      </div>
    </div>
  );
}
