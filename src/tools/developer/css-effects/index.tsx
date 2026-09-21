import { useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, Segmented, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';

interface ShadowLayer {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  inset: boolean;
}

const DEFAULT_SHADOWS: ShadowLayer[] = [
  { x: '0', y: '1', blur: '3', spread: '0', color: '#3e45ce40', inset: false },
  { x: '0', y: '8', blur: '24', spread: '-6', color: '#3e45ce33', inset: false },
];

function shadowCss(layers: ShadowLayer[]): string {
  return layers
    .map((l) => `${l.inset ? 'inset ' : ''}${l.x || 0}px ${l.y || 0}px ${l.blur || 0}px ${l.spread || 0}px ${l.color}`)
    .join(', ');
}

export default function CssEffects() {
  const [tab, setTab] = useState<'shadow' | 'gradient'>('shadow');
  const [layers, setLayers] = useState<ShadowLayer[]>(DEFAULT_SHADOWS);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState('135');
  const [stopA, setStopA] = useState('#3e45ce');
  const [stopB, setStopB] = useState('#1f6f54');

  const gradientCss =
    gradientType === 'linear'
      ? `linear-gradient(${angle}deg, ${stopA}, ${stopB})`
      : `radial-gradient(circle at 50% 50%, ${stopA}, ${stopB})`;

  const css = tab === 'shadow' ? `box-shadow: ${shadowCss(layers)};` : `background: ${gradientCss};`;
  const previewStyle = tab === 'shadow' ? { boxShadow: shadowCss(layers) } : { background: gradientCss };

  const updateLayer = (index: number, patch: Partial<ShadowLayer>) =>
    setLayers((ls) => ls.map((layer, i) => (i === index ? { ...layer, ...patch } : layer)));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Segmented
          ariaLabel="Effect kind"
          options={[
            { value: 'shadow', label: 'Box shadow' },
            { value: 'gradient', label: 'Gradient' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'shadow' ? (
          <div className="space-y-4">
            {layers.map((layer, index) => (
              <div key={index} className="space-y-3 rounded-md border border-line bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] text-faint">layer {index + 1}</p>
                  <div className="flex items-center gap-3 text-[13px]">
                    <label className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={layer.inset}
                        onChange={(e) => updateLayer(index, { inset: e.target.checked })}
                        className="size-3.5 cursor-pointer accent-[var(--ink)]"
                      />
                      inset
                    </label>
                    {layers.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setLayers((ls) => ls.filter((_, i) => i !== index))}
                        className="cursor-pointer text-faint hover:text-fg"
                        aria-label={`Remove layer ${index + 1}`}
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(['x', 'y', 'blur', 'spread'] as const).map((key) => (
                    <Field key={key} label={key}>
                      <TextInput
                        type="number"
                        value={layer[key]}
                        onChange={(e) => updateLayer(index, { [key]: e.target.value } as Partial<ShadowLayer>)}
                        className="text-right"
                        aria-label={`Layer ${index + 1} ${key}`}
                      />
                    </Field>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6,8}$/i.test(layer.color) ? layer.color.slice(0, 7) : '#000000'}
                    onChange={(e) => updateLayer(index, { color: e.target.value + '66' })}
                    aria-label={`Layer ${index + 1} color`}
                    className="size-8 cursor-pointer rounded border border-line bg-transparent p-0.5"
                  />
                  <TextInput
                    value={layer.color}
                    onChange={(e) => updateLayer(index, { color: e.target.value })}
                    className="font-mono text-[12.5px]"
                    aria-label={`Layer ${index + 1} color value`}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLayers((ls) => [...ls, { x: '0', y: '4', blur: '12', spread: '0', color: '#00000026', inset: false }])}
              className="cursor-pointer text-sm font-medium text-ink hover:underline"
            >
              + Add layer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <Segmented
              ariaLabel="Gradient type"
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'radial', label: 'Radial' },
              ]}
              value={gradientType}
              onChange={setGradientType}
            />
            {gradientType === 'linear' ? (
              <Field label="Angle (deg)" htmlFor="grad-angle">
                <TextInput id="grad-angle" type="number" value={angle} onChange={(e) => setAngle(e.target.value)} className="w-28! text-right" />
              </Field>
            ) : null}
            <Field label="From" htmlFor="grad-a">
              <div className="flex gap-2">
                <input type="color" value={stopA} onChange={(e) => setStopA(e.target.value)} aria-label="From color" className="size-10 cursor-pointer rounded-md border border-line bg-transparent p-1" />
                <TextInput id="grad-a" value={stopA} onChange={(e) => setStopA(e.target.value)} className="font-mono" />
              </div>
            </Field>
            <Field label="To" htmlFor="grad-b">
              <div className="flex gap-2">
                <input type="color" value={stopB} onChange={(e) => setStopB(e.target.value)} aria-label="To color" className="size-10 cursor-pointer rounded-md border border-line bg-transparent p-1" />
                <TextInput id="grad-b" value={stopB} onChange={(e) => setStopB(e.target.value)} className="font-mono" />
              </div>
            </Field>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <TitleBlock title="Preview" tone="pencil" />
        <div className="flex min-h-64 items-center justify-center rounded-md border border-line bg-raised/50 p-10">
          <div className="size-40 rounded-xl bg-surface" style={previewStyle} aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[11px] text-faint">css</p>
          <pre className="overflow-auto rounded-md border border-line bg-raised/50 p-3 font-mono text-[13px] text-fg">{css}</pre>
          <CopyButton text={css} label="Copy CSS" />
        </div>
      </div>
    </div>
  );
}
