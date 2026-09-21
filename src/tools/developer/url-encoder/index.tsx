import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, Segmented, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';

type Mode = 'encode-component' | 'encode-uri' | 'decode';

const SAMPLE = 'https://localcraft.app/search?q=hello world&lang=en#results';

export default function UrlEncoder() {
  const [mode, setMode] = useState<Mode>('encode-component');
  const [input, setInput] = useState(SAMPLE);

  const output = useMemo(() => {
    try {
      switch (mode) {
        case 'encode-component':
          return encodeURIComponent(input);
        case 'encode-uri':
          return encodeURI(input);
        case 'decode':
          return decodeURIComponent(input.replace(/\+/g, '%20'));
      }
    } catch {
      return null;
    }
  }, [mode, input]);

  const queryParams = useMemo(() => {
    if (mode !== 'decode' || !input.includes('?')) return null;
    try {
      const params = new URL(input.includes('://') ? input : `https://placeholder.local${input.startsWith('/') ? input : `/${input}`}`).searchParams;
      return [...params.entries()];
    } catch {
      return null;
    }
  }, [mode, input]);

  return (
    <div className="space-y-6">
      <Segmented
        ariaLabel="Mode"
        options={[
          { value: 'encode-component', label: 'Encode component' },
          { value: 'encode-uri', label: 'Encode full URI' },
          { value: 'decode', label: 'Decode' },
        ]}
        value={mode}
        onChange={setMode}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <TitleBlock title="Input" />
          <Field label={mode === 'decode' ? 'Encoded URL' : 'URL or text'} htmlFor="url-in">
            <TextArea
              id="url-in"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-40 font-mono text-[13px]"
              spellCheck={false}
            />
          </Field>
        </div>
        <div className="space-y-4">
          <TitleBlock title="Output" />
          {output !== null ? (
            <>
              <TextArea value={output} readOnly aria-label="URL output" className="min-h-40 font-mono text-[13px]" spellCheck={false} />
              <CopyButton text={output} />
            </>
          ) : (
            <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
              ✗ That is not a valid percent-encoded string.
            </p>
          )}
          {queryParams ? (
            <div className="space-y-1.5 rounded-md border border-line bg-raised/50 p-4">
              <p className="font-mono text-[11px] text-faint">query parameters</p>
              {queryParams.map(([key, value], index) => (
                <div key={`${key}-${index}`} className="flex justify-between gap-4 font-mono text-[12.5px]">
                  <span className="text-ink">{key}</span>
                  <span className="truncate text-fg">{value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
