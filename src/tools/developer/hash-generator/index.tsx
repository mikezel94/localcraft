import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, TextArea } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { pickFile, formatBytes } from '@/lib/files';

/**
 * Compact MD5 (RFC 1321) — Web Crypto deliberately omits it. Standard public-domain
 * algorithm; digests here are for checksums/props, never for security.
 */
function md5(input: Uint8Array): string {
  // Rotation schedule, 64 entries (RFC 1321)
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);

  const origLen = input.length;
  const withPadding = (((origLen + 8) >> 6) + 1) << 6;
  const message = new Uint8Array(withPadding);
  message.set(input);
  message[origLen] = 0x80;
  const bitLen = origLen * 8;
  const lengthView = new DataView(message.buffer);
  lengthView.setUint32(withPadding - 8, bitLen >>> 0, true);
  lengthView.setUint32(withPadding - 4, Math.floor(bitLen / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const view = new DataView(message.buffer);
  for (let chunk = 0; chunk < withPadding; chunk += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(chunk + i * 4, true);
    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const sum = (F + A + K[i]! + M[g]!) | 0;
      const oldD = D;
      D = C;
      C = B;
      B = (B + ((sum << S[i]!) | (sum >>> (32 - S[i]!)))) | 0;
      A = oldD;
    }
    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  }
  const out = new DataView(new ArrayBuffer(16));
  out.setUint32(0, a0, true);
  out.setUint32(4, b0, true);
  out.setUint32(8, c0, true);
  out.setUint32(12, d0, true);
  return [...new Uint8Array(out.buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha(algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512', data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(algorithm, data as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface Hashes {
  md5: string;
  'sha-1': string;
  'sha-256': string;
  'sha-512': string;
}

function useHashState() {
  const [hashes, setHashes] = useState<Hashes | null>(null);
  const [source, setSource] = useState<string>('');
  const [failed, setFailed] = useState(false);

  const compute = useCallback(async (label: string, data: Uint8Array) => {
    try {
      const [md5Hash, s1, s256, s512] = await Promise.all([
        Promise.resolve(md5(data)),
        sha('SHA-1', data),
        sha('SHA-256', data),
        sha('SHA-512', data),
      ]);
      setSource(label);
      setHashes({ md5: md5Hash, 'sha-1': s1, 'sha-256': s256, 'sha-512': s512 });
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);
  return { hashes, source, compute, failed };
}

const SAMPLE = 'Everything sits in your browser.';

export default function HashGenerator() {
  const { hashes, source, compute, failed } = useHashState();
  const [text, setText] = useState(SAMPLE);
  const [fileNote, setFileNote] = useState<string | null>(null);

  const digestText = () => void compute(`text · ${text.length} chars`, new TextEncoder().encode(text));

  // Show digests for the sample immediately — hashing is local and instant.
  useEffect(() => {
    void compute(`text · ${SAMPLE.length} chars`, new TextEncoder().encode(SAMPLE));
  }, [compute]);

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <div className="space-y-4">
          <TitleBlock title="Input" />
          <Field label="Text" htmlFor="hash-in">
            <TextArea id="hash-in" value={text} onChange={(e) => setText(e.target.value)} className="min-h-32 font-mono text-[13px]" spellCheck={false} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={digestText}>
              Hash text
            </Button>
            <Button
              onClick={() => {
                void pickFile().then(async (file) => {
                  if (!file) return;
                  const bytes = new Uint8Array(await file.arrayBuffer());
                  setFileNote(`${file.name} · ${formatBytes(bytes.length)}`);
                  await compute(`file · ${file.name}`, bytes);
                });
              }}
            >
              Hash a file…
            </Button>
          </div>
          {fileNote ? <p className="font-mono text-[12px] text-faint">{fileNote}</p> : null}
          <p className="text-xs leading-snug text-faint">
            MD5 and SHA-1 are quick checksums, not security. Digests are computed on this machine via Web Crypto.
          </p>
        </div>

        <div className="space-y-3">
          <TitleBlock title="Digests" tone="pencil" />
          {hashes ? (
            <ul className="space-y-2">
              {(
                [
                  ['MD5', hashes.md5],
                  ['SHA-1', hashes['sha-1']],
                  ['SHA-256', hashes['sha-256']],
                  ['SHA-512', hashes['sha-512']],
                ] as const
              ).map(([name, value]) => (
                <li key={name} className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2">
                  <span className="w-16 shrink-0 font-mono text-[12px] text-faint">{name}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-fg" title={value}>
                    {value}
                  </span>
                  <CopyButton text={value} label="" ariaLabel={`Copy ${name} digest`} className="shrink-0 border-0 px-1.5" />
                </li>
              ))}
              <li className="pt-1 font-mono text-[11px] text-faint">of {source}</li>
            </ul>
          ) : failed ? (
            <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
              ✗ Hashing is unavailable here — Web Crypto needs a secure context (https or localhost).
            </p>
          ) : (
            <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
              Pick “Hash text” or hash a file to see digests.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
