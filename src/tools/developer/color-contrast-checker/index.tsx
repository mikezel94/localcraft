import { useState } from 'react';

import { Field, TextInput } from '@/components/ui/inputs';
import { Badge, TitleBlock } from '@/components/ui/misc';

function hexToRgb01(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!m) return null;
  const full = m[1]!.length === 3 ? m[1]!.split('').map((c) => c + c).join('') : m[1]!;
  const int = parseInt(full, 16);
  return { r: ((int >> 16) & 255) / 255, g: ((int >> 8) & 255) / 255, b: (int & 255) / 255 };
}

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a: string, b: string): number | null {
  const la = a && b ? luminance(hexToRgb01(a) ?? { r: 0, g: 0, b: 0 }) : null;
  if (la === null) return null;
  const lb = luminance(hexToRgb01(b) ?? { r: 0, g: 0, b: 0 });
  const [lighter, darker] = la >= lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

function mixToward(hex: string, target: string, amount: number): string {
  const from = hexToRgb01(hex)!;
  const to = hexToRgb01(target)!;
  const ch = (f: number, t: number) => Math.round((f + (t - f) * amount) * 255);
  return `#${[ch(from.r, to.r), ch(from.g, to.g), ch(from.b, to.b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Nudge the foreground toward white/black until the ratio passes the target. */
function suggestFix(fg: string, bg: string, target: number): string | null {
  const f = hexToRgb01(fg);
  const b = hexToRgb01(bg);
  if (!f || !b) return null;
  const bgLum = luminance(b);
  const targetInk = bgLum > 0.35 ? '#000000' : '#ffffff';
  for (let amount = 5; amount <= 100; amount += 5) {
    const candidate = mixToward(fg, targetInk, amount / 100);
    const r = ratio(candidate, bg)!;
    if (r >= target) return candidate;
  }
  return targetInk;
}

const PASS = (pass: boolean) => (
  <Badge tone={pass ? 'pencil' : 'neutral'}>{pass ? 'pass' : 'fail'}</Badge>
);

export default function ColorContrastChecker() {
  const [fg, setFg] = useState('#3e45ce');
  const [bg, setBg] = useState('#f2f4f8');

  const current = ratio(fg, bg);
  const aaNormal = current !== null && current >= 4.5;
  const aaLarge = current !== null && current >= 3;
  const aaaNormal = current !== null && current >= 7;
  const aaaLarge = current !== null && current >= 4.5;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="Colors" />
        <Field label="Foreground (text)" htmlFor="cc-fg">
          <div className="flex gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(fg) ? fg : '#000000'}
              onChange={(e) => setFg(e.target.value)}
              aria-label="Foreground color"
              className="size-10 cursor-pointer rounded-md border border-line bg-transparent p-1"
            />
            <TextInput id="cc-fg" value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" />
          </div>
        </Field>
        <Field label="Background" htmlFor="cc-bg">
          <div className="flex gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(bg) ? bg : '#ffffff'}
              onChange={(e) => setBg(e.target.value)}
              aria-label="Background color"
              className="size-10 cursor-pointer rounded-md border border-line bg-transparent p-1"
            />
            <TextInput id="cc-bg" value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" />
          </div>
        </Field>
        <button
          type="button"
          onClick={() => {
            setFg(bg);
            setBg(fg);
          }}
          aria-label="Swap foreground and background colors"
          className="w-fit cursor-pointer text-sm font-medium text-ink hover:underline"
        >
          ⇄ Swap colors
        </button>
        {current === null ? <p className="font-mono text-[12px] text-muted">Enter two valid hex colors.</p> : null}
      </div>

      <div className="space-y-5">
        <div className="rounded-md border border-line bg-surface p-6">
          <p className="font-mono text-[11px] text-faint">contrast ratio</p>
          <p className="font-display text-[44px] font-semibold leading-tight text-fg">
            {current !== null ? `${current.toFixed(2)}:1` : '—'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PASS(aaNormal)} <span className="text-[11px] text-muted">AA normal text (4.5)</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PASS(aaLarge)} <span className="text-[11px] text-muted">AA large text (3.0)</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PASS(aaaNormal)} <span className="text-[11px] text-muted">AAA normal text (7.0)</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PASS(aaaLarge)} <span className="text-[11px] text-muted">AAA large text (4.5)</span>
          </div>
        </div>

        <div className="rounded-md border border-line p-6" style={{ backgroundColor: bg }}>
          <p className="font-display text-[22px] font-semibold" style={{ color: fg }}>
            The toolbox that never phones home.
          </p>
          <p className="mt-1 text-[15px]" style={{ color: fg }}>
            Body-size sample text (15–16px) at normal weight.
          </p>
          <p className="mt-1 text-[13px] font-semibold" style={{ color: fg }}>
            Small bold text counts as “large” from 14pt bold.
          </p>
        </div>

        {current !== null && !aaNormal ? (
          <div className="space-y-2 rounded-md border border-dashed border-line-strong bg-raised/40 p-4">
            <p className="font-mono text-[12px] text-muted">
              Suggestion for AA normal: <span className="font-semibold text-fg">{suggestFix(fg, bg, 4.5)}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                const fixed = suggestFix(fg, bg, 4.5);
                if (fixed) setFg(fixed);
              }}
              className="cursor-pointer text-sm font-medium text-ink hover:underline"
            >
              Apply to foreground
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
