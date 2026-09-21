import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/ui/misc';
import { Field, TextArea } from '@/components/ui/inputs';
import { Badge, TitleBlock } from '@/components/ui/misc';
import { decodeBase64Url, highlightJson } from '@/lib/highlight';

const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsb2NhbGNyYWZ0LTAxIiwibmFtZSI6Ik1hcnRhIEtvd2Fsc2thIiwiaWF0IjoxNzU4MDAwMDAwLCJleHAiOjE5MTYwMDAwMDB9.dQw4w9WgXcQ-placeholder-signature';

interface Claims {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signaturePresent: boolean;
}

function decodeJwt(token: string): Claims {
  const parts = token.trim().split('.');
  if (parts.length < 2) throw new Error('A JWT needs at least two dot-separated segments.');
  const header = JSON.parse(decodeBase64Url(parts[0]!)) as Record<string, unknown>;
  const payload = JSON.parse(decodeBase64Url(parts[1]!)) as Record<string, unknown>;
  return { header, payload, signaturePresent: Boolean(parts[2]) };
}

function formatClaim(value: unknown): string | null {
  if (typeof value !== 'number' || value < 1e8) return null;
  return new Date(value * 1000).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function JwtDecoder() {
  const [token, setToken] = useState(SAMPLE);

  const result = useMemo(() => {
    if (!token.trim()) return null;
    try {
      return { ok: true as const, claims: decodeJwt(token) };
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : 'Could not decode.' };
    }
  }, [token]);

  const payloadJson = result?.ok ? JSON.stringify(result.claims.payload, null, 2) : '';
  const expired =
    result?.ok && typeof result.claims.payload.exp === 'number'
      ? result.claims.payload.exp * 1000 < Date.now()
      : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <TitleBlock title="Token" />
        <Field label="JSON Web Token" htmlFor="jwt-in" hint="Decoding only — verification would need the signing key.">
          <TextArea
            id="jwt-in"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="min-h-40 font-mono text-[12px]"
            spellCheck={false}
          />
        </Field>
        {result && !result.ok ? (
          <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
            ✗ {result.error}
          </p>
        ) : null}
        {expired !== null ? (
          <Badge tone={expired ? 'neutral' : 'pencil'}>{expired ? 'expired' : 'not expired'}</Badge>
        ) : null}
      </div>

      {result?.ok ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TitleBlock title="Header" />
              <CopyButton text={JSON.stringify(result.claims.header, null, 2)} className="px-2 py-1" label="" ariaLabel="Copy header JSON" />
            </div>
            <pre
              className="overflow-auto rounded-md border border-line bg-raised/50 p-4 font-mono text-[12.5px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightJson(JSON.stringify(result.claims.header, null, 2)) }}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <TitleBlock title="Payload" tone="pencil" />
              <CopyButton text={payloadJson} className="px-2 py-1" label="" ariaLabel="Copy payload JSON" />
            </div>
            <pre
              className="max-h-72 overflow-auto rounded-md border border-line bg-raised/50 p-4 font-mono text-[12.5px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightJson(payloadJson) }}
            />
            <ul className="space-y-1 font-mono text-[12px] text-muted">
              {(['iat', 'nbf', 'exp'] as const).map((claim) => {
                const formatted = formatClaim(result.claims.payload[claim]);
                return formatted ? <li key={claim}>{claim}: {formatted}</li> : null;
              })}
              <li>signature: {result.claims.signaturePresent ? 'present (not verified)' : 'absent (unsigned token)'}</li>
            </ul>
          </div>
        </div>
      ) : (
        <p className="h-fit rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
          Paste a token to inspect its header and payload.
        </p>
      )}
    </div>
  );
}
