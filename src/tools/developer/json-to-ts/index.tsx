import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, TextArea, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';

const SAMPLE = `{
  "id": "tool-01",
  "name": "LocalCraft",
  "tags": ["pdf", "private"],
  "meta": { "stars": 4.8, "openSource": true, "repo": null },
  "releases": [{ "version": "0.1.0", "date": "2026-09-17" }]
}`;

function pascal(text: string): string {
  return (
    text
      .replace(/[^a-zA-Z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, (c) => c.toUpperCase()) || 'Root'
  );
}

/**
 * Infers TypeScript interfaces from a JSON sample. Nested objects become named
 * interfaces; arrays union their element types.
 */
function generate(input: string, rootName: string): string {
  const blocks: string[] = [];
  let counter = 0;

  function typeOf(value: unknown, hint: string): string {
    if (value === null) return 'null';
    switch (typeof value) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object': {
        if (Array.isArray(value)) {
          if (value.length === 0) return 'unknown[]';
          const members = [...new Set(value.map((item) => typeOf(item, hint.replace(/s$/, ''))))];
          const union = members.join(' | ');
          return members.length > 1 ? `(${union})[]` : `${union}[]`;
        }
        const name = `${pascal(hint) || 'Nested'}${counter > 0 ? counter : ''}`;
        counter += 1;
        const lines = Object.entries(value as Record<string, unknown>).map(([key, child]) => {
          const safeKey = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
          return `  ${safeKey}: ${typeOf(child, key)};`;
        });
        blocks.push(`export interface ${name} {\n${lines.length > 0 ? lines.join('\n') : '  [key: string]: unknown;'}\n}`);
        return name;
      }
      default:
        return 'unknown';
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return '';
  }
  const rootType = typeOf(parsed, rootName);

  const header = `// Generated locally with LocalCraft — sample-based types, review before shipping.\n`;
  if (blocks.length === 0) {
    return `${header}export type ${pascal(rootName)} = ${rootType};\n`;
  }
  const footer = rootType.startsWith('null') || ['string', 'number', 'boolean'].includes(rootType)
    ? `\nexport type ${pascal(rootName)} = ${rootType};\n`
    : '';
  return `${header}${[...blocks].reverse().join('\n\n')}${footer}`;
}

export default function JsonToTs() {
  const [input, setInput] = useState(SAMPLE);
  const [rootName, setRootName] = useState('Root');

  const output = useMemo(() => generate(input, rootName || 'Root'), [input, rootName]);
  const invalid = useMemo(() => {
    try {
      JSON.parse(input);
      return null;
    } catch (error) {
      return error instanceof Error ? 'Invalid JSON input.' : 'Invalid JSON input.';
    }
  }, [input]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="JSON" />
        <Field label="Sample JSON" htmlFor="jt-in">
          <TextArea
            id="jt-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-72 font-mono text-[13px]"
            spellCheck={false}
          />
        </Field>
        <Field label="Root type name" htmlFor="jt-root">
          <TextInput id="jt-root" value={rootName} onChange={(e) => setRootName(e.target.value)} className="w-48!" />
        </Field>
      </div>

      <div className="space-y-4">
        <TitleBlock title="TypeScript" />
        {invalid ? (
          <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
            ✗ {invalid}
          </p>
        ) : null}
        {output ? (
          <>
            <pre className="max-h-[28rem] overflow-auto rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px] leading-relaxed text-fg">
              {output}
            </pre>
            <div className="flex gap-2">
              <CopyButton text={output} />
              <Button onClick={() => downloadFile(output, `${(rootName || 'types').toLowerCase()}.ts`, 'text/plain')}>
                Download .ts
              </Button>
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
            Interfaces appear here.
          </p>
        )}
      </div>
    </div>
  );
}
