import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Checkbox, Field, Segmented, TextInput } from '@/components/ui/inputs';

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};
const AMBIGUOUS = 'Il1O0o';

// A small built-in wordlist for passphrases — no dictionary download needed.
const WORDS =
  'anchor autumn basket beacon breeze bridge butter cactus canyon cedar cherry copper coral crimson cypress dawn delta ember falcon fern flint forge fossil garden garnet glacier granite harbor hazel indigo ivy juniper kernel lantern lichen linen maple marble meadow mesa mint nectar north oasis olive onyx orbit otter pasture pebble pepper pigeon plume quartz quiver rabbit raven ribbon ridge river rosemary saffron sage sandal granite sequoia shadow slate spruce summit tangerine thistle thunder timber topaz turtle umber valley velvet violet walnut willow window winter yarrow zephyr'.split(
    ' ',
  );

function randomInt(max: number): number {
  // Rejection sampling keeps the distribution uniform.
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0]!;
  } while (value >= limit);
  return value % max;
}

function pick<T>(list: T[]): T {
  return list[randomInt(list.length)]!;
}

interface PasswordOptions {
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  noAmbiguous: boolean;
}

function makePassword(length: number, options: PasswordOptions): string {
  let alphabet = '';
  for (const key of ['lower', 'upper', 'digits', 'symbols'] as const) {
    if (!options[key]) continue;
    let set = SETS[key];
    if (options.noAmbiguous) set = [...set].filter((c) => !AMBIGUOUS.includes(c)).join('');
    alphabet += set;
  }
  if (!alphabet) return '';
  return Array.from({ length }, () => pick([...alphabet])).join('');
}

function makePassphrase(words: number, separator: string, capitalize: boolean, addNumber: boolean): string {
  const parts = Array.from({ length: words }, () => (capitalize ? pick(WORDS).replace(/^./, (c) => c.toUpperCase()) : pick(WORDS)));
  if (addNumber) parts.splice(randomInt(parts.length + 1), 0, String(randomInt(100)));
  return parts.join(separator);
}

export default function PasswordGenerator() {
  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [length, setLength] = useState('20');
  const [options, setOptions] = useState<PasswordOptions>({ lower: true, upper: true, digits: true, symbols: true, noAmbiguous: true });
  const [wordCount, setWordCount] = useState('4');
  const [separator, setSeparator] = useState('-');
  const [capitalize, setCapitalize] = useState(true);
  const [addNumber, setAddNumber] = useState(true);
  const [results, setResults] = useState<string[]>([]);

  const generate = useCallback(() => {
    setResults(
      Array.from({ length: 5 }, () =>
        mode === 'password'
          ? makePassword(Math.max(4, Math.min(128, parseInt(length) || 20)), options)
          : makePassphrase(Math.max(2, Math.min(12, parseInt(wordCount) || 4)), separator, capitalize, addNumber),
      ),
    );
  }, [mode, length, options, wordCount, separator, capitalize, addNumber]);

  useEffect(() => {
    generate();
  }, [generate]);

  const alphabetSize =
    mode === 'passphrase'
      ? WORDS.length + (addNumber ? 100 : 0)
      : Object.entries(SETS).reduce((total, [key, set]) => (options[key as keyof PasswordOptions] ? total + set.length : total), 0);
  const bits = Math.round((Math.log2(alphabetSize) || 0) * (mode === 'password' ? (parseInt(length) || 20) : parseInt(wordCount) || 4));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Kind"
          options={[
            { value: 'password', label: 'Password' },
            { value: 'passphrase', label: 'Passphrase' },
          ]}
          value={mode}
          onChange={setMode}
          className="w-52!"
        />
        <Button variant="primary" onClick={generate}>
          <RefreshCw className="size-4" aria-hidden />
          Regenerate
        </Button>
        <CopyButton text={results[0] ?? ''} label="Copy first" />
        <CopyButton text={results.join('\n')} label="Copy all" />
      </div>

      {mode === 'password' ? (
        <div className="space-y-3">
          <Field label={`Length — ${Math.max(4, Math.min(128, parseInt(length) || 20))}`} htmlFor="pw-length">
            <input
              id="pw-length"
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full max-w-sm cursor-pointer accent-[var(--ink)]"
            />
          </Field>
          <div className="flex flex-wrap gap-5">
            <Checkbox label="a-z" checked={options.lower} onChange={(lower) => setOptions((o) => ({ ...o, lower }))} />
            <Checkbox label="A-Z" checked={options.upper} onChange={(upper) => setOptions((o) => ({ ...o, upper }))} />
            <Checkbox label="0-9" checked={options.digits} onChange={(digits) => setOptions((o) => ({ ...o, digits }))} />
            <Checkbox label="!@#…" checked={options.symbols} onChange={(symbols) => setOptions((o) => ({ ...o, symbols }))} />
            <Checkbox label="Exclude ambiguous (Il1O0)" checked={options.noAmbiguous} onChange={(noAmbiguous) => setOptions((o) => ({ ...o, noAmbiguous }))} />
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Words" htmlFor="pw-words">
            <TextInput id="pw-words" type="number" min={2} max={12} value={wordCount} onChange={(e) => setWordCount(e.target.value)} className="w-24! text-right" />
          </Field>
          <Field label="Separator" htmlFor="pw-sep">
            <TextInput id="pw-sep" value={separator} onChange={(e) => setSeparator(e.target.value)} className="w-16! text-center font-mono" />
          </Field>
          <Checkbox label="Capitalize" checked={capitalize} onChange={setCapitalize} />
          <Checkbox label="Include a number" checked={addNumber} onChange={setAddNumber} />
        </div>
      )}

      <ul className="space-y-2">
        {results.map((value, index) => (
          <li key={index} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
            <span className="min-w-0 flex-1 break-all font-mono text-[13.5px] text-fg">{value}</span>
            <CopyButton text={value} label="" ariaLabel={`Copy ${mode} ${index + 1}`} className="shrink-0 border-0 px-1.5" />
          </li>
        ))}
      </ul>
      <p className="font-mono text-[12px] text-muted">
        ≈{Number.isFinite(bits) ? bits : '?'} bits of entropy · drawn from crypto.getRandomValues, computed locally
      </p>
    </div>
  );
}
