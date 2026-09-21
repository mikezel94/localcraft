import Papa from 'papaparse';
import { useMemo, useState } from 'react';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, Segmented, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';



type Mode = 'yaml-json' | 'json-yaml' | 'csv-json' | 'json-csv';

const MODES: { value: Mode; label: string; from: string; to: string }[] = [
  { value: 'yaml-json', label: 'YAML → JSON', from: 'yaml', to: 'json' },
  { value: 'json-yaml', label: 'JSON → YAML', from: 'json', to: 'yaml' },
  { value: 'csv-json', label: 'CSV → JSON', from: 'csv', to: 'json' },
  { value: 'json-csv', label: 'JSON → CSV', from: 'json', to: 'csv' },
];

const SAMPLES: Record<Mode, string> = {
  'yaml-json': 'name: LocalCraft\nprivate: true\ntools:\n  - json\n  - csv\nmeta:\n  stars: 4.8\n',
  'json-yaml': '{"name":"LocalCraft","private":true,"tools":["json","csv"],"meta":{"stars":4.8}}',
  'csv-json': 'name,qty,price\nFlat white,1,4.20\nCardamom bun,2,3.80\n',
  'json-csv': '[{"name":"Flat white","qty":1,"price":4.2},{"name":"Cardamom bun","qty":2,"price":3.8}]',
};

function convert(mode: Mode, input: string): string {
  switch (mode) {
    case 'yaml-json':
      return JSON.stringify(parseYaml(input), null, 2);
    case 'json-yaml':
      return stringifyYaml(JSON.parse(input));
    case 'csv-json': {
      const parsed = Papa.parse<Record<string, string>>(input.trim(), { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error(parsed.errors[0]!.message);
      }
      return JSON.stringify(parsed.data, null, 2);
    }
    case 'json-csv': {
      const data = JSON.parse(input) as Record<string, unknown>[];
      if (!Array.isArray(data)) throw new Error('JSON input must be an array of objects for CSV output.');
      return Papa.unparse(data);
    }
  }
}

export default function DataConverter() {
  const [mode, setMode] = useState<Mode>('yaml-json');
  const [input, setInput] = useState(SAMPLES['yaml-json']);

  const current = MODES.find((m) => m.value === mode)!;
  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: true as const, text: '' };
    try {
      return { ok: true as const, text: convert(mode, input) };
    } catch (err) {
      return { ok: false as const, text: '', error: err instanceof Error ? err.message : String(err) };
    }
  }, [mode, input]);

  const outputText = parsed.ok ? parsed.text : '';

  return (
    <div className="space-y-6">
      <Segmented
        ariaLabel="Conversion direction"
        options={MODES.map((m) => ({ value: m.value, label: m.label }))}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setInput(SAMPLES[next]);
        }}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <TitleBlock title={current.from.toUpperCase()} />
          <Field label={`Input (${current.from})`} htmlFor="dc-in">
            <TextArea
              id="dc-in"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-64 font-mono text-[13px]"
              spellCheck={false}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <TitleBlock title={current.to.toUpperCase()} />
          {parsed.ok && outputText ? (
            <>
              <TextArea value={outputText} readOnly aria-label={`Converted ${current.to}`} className="min-h-64 font-mono text-[13px]" spellCheck={false} />
              <div className="flex flex-wrap gap-2">
                <CopyButton text={outputText} />
                <Button
                  onClick={() =>
                    downloadFile(
                      outputText,
                      `converted.${current.to}`,
                      current.to === 'json' ? 'application/json' : 'text/plain',
                    )
                  }
                >
                  Download .{current.to}
                </Button>
              </div>
            </>
          ) : (
            <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
              {parsed.ok ? 'Converted data appears here.' : 'Fix the input to see the result.'}
            </p>
          )}
          {!parsed.ok ? (
            <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
              ✗ {parsed.error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
