import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';
import { pickFile } from '@/lib/files';
import { cleanSvg, sanitizeSvgPreview } from './svg';

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="120" height="80.00000000"
     viewBox="0 0 120 80">
  <!-- created in a drawing app -->
  <metadata>exported with love and 4 KB of cruft</metadata>
  <title>Compass</title>
  <g inkscape:groupmode="layer" id="layer1">
    <g id="unused-empty-group"></g>
    <rect x="10.000000" y="10.000000" width="100.000000" height="60.000000" rx="12" fill="#3e45ce"></rect>
    <circle cx="60.000000" cy="30.000000" r="8.00000000" fill="none" stroke="#f2f4f9" stroke-width="4" opacity="1"></circle>
    <path d="M 52 54 L 68 54" stroke="#f2f4f9" stroke-width="3" display="none"></path>
  </g>
</svg>`;

export default function SvgOptimizer() {
  const [input, setInput] = useState(SAMPLE);

  const result = useMemo(() => cleanSvg(input), [input]);
  const saved = input.length > 0 ? Math.max(0, 100 - (result.text.length / input.length) * 100) : 0;
  const valid = /<svg[\s>]/i.test(input);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void pickFile('image/svg+xml').then((f) => f && void f.text().then(setInput))}>
          Open .svg file…
        </Button>
        {valid ? null : <span className="font-mono text-[12px] text-muted">✗ That does not look like SVG.</span>}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <TitleBlock title="Source" />
          <Field label="SVG markup" htmlFor="svg-in">
            <TextArea id="svg-in" value={input} onChange={(e) => setInput(e.target.value)} className="min-h-64 font-mono text-[12px]" spellCheck={false} />
          </Field>
          <p className="font-mono text-[12px] text-muted">{formatBytes(input.length)}</p>
        </div>

        <div className="space-y-4">
          <TitleBlock title="Cleaned" tone="pencil" />
          <div className="flex min-h-28 items-center justify-center rounded-md border border-line bg-raised/50 p-4">
            <div
              role="img"
              aria-label="Cleaned SVG preview"
              className="max-h-40 [&_svg]:max-h-40 [&_svg]:w-auto"
              // User-supplied markup: active content (scripts, event handlers) is
              // stripped before render. Displayed locally, never uploaded.
              dangerouslySetInnerHTML={{ __html: sanitizeSvgPreview(result.text) }}
            />
          </div>
          <pre className="max-h-56 overflow-auto rounded-md border border-line bg-raised/50 p-4 font-mono text-[12px] leading-relaxed text-fg">
            {result.text}
          </pre>
          <p className="font-mono text-[12px] text-muted">
            {formatBytes(result.text.length)} · <span className="text-pencil">−{saved.toFixed(0)}%</span>
            {result.removed.length > 0 ? ` · removed: ${result.removed.join(', ')}` : ''}
          </p>
          <div className="flex gap-2">
            <CopyButton text={result.text} />
            <Button onClick={() => downloadFile(result.text, 'optimized.svg', 'image/svg+xml')} disabled={!result.text}>
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
