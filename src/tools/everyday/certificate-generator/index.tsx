import { useState } from 'react';

import { PdfPreview } from '@/components/PdfPreview';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, TextInput } from '@/components/ui/inputs';
import { ColorSwatches, TitleBlock } from '@/components/ui/misc';
import { useDebouncedBytes } from '@/lib/useDebouncedBytes';
import { downloadFile, slugify } from '@/lib/utils';
import { buildCertificatePdf, type CertificateSpec } from './pdf';

const ACCENTS = ['#3e45ce', '#b3382f', '#1f6f54', '#8a5a00', '#2b2f42'];

export default function CertificateGenerator() {
  const [spec, setSpec] = useState<CertificateSpec>({
    title: 'Certificate of Completion',
    organization: 'Nordwind Academy',
    recipient: 'Marta Kowalska',
    reason: 'for completing the Client-Side Craft curriculum with distinction.',
    dateLabel: `Awarded ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
    signerName: 'Noor Haddad',
    signerRole: 'Program director',
    secondSignerName: 'Ellis Grey',
    secondSignerRole: 'Lead instructor',
    accentHex: '#2b2f42',
    showSeal: true,
  });

  const patch = (p: Partial<CertificateSpec>) => setSpec((s) => ({ ...s, ...p }));
  const { bytes, error } = useDebouncedBytes(() => buildCertificatePdf(spec), [JSON.stringify(spec)]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
      <div className="space-y-9">
        <Button
          variant="primary"
          disabled={!bytes}
          onClick={() => bytes && downloadFile(bytes, `certificate-${slugify(spec.recipient)}.pdf`, 'application/pdf')}
        >
          Download PDF
        </Button>
        {error ? <span className="text-xs text-muted">Build failed: {error}</span> : null}

        <section className="space-y-4">
          <TitleBlock title="Content" />
          <Field label="Title" htmlFor="ct-title">
            <TextInput id="ct-title" value={spec.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field label="Organization" htmlFor="ct-org">
            <TextInput id="ct-org" value={spec.organization} onChange={(e) => patch({ organization: e.target.value })} />
          </Field>
          <Field label="Recipient" htmlFor="ct-recipient">
            <TextInput id="ct-recipient" value={spec.recipient} onChange={(e) => patch({ recipient: e.target.value })} />
          </Field>
          <Field label="Reason line" htmlFor="ct-reason">
            <TextInput id="ct-reason" value={spec.reason} onChange={(e) => patch({ reason: e.target.value })} />
          </Field>
          <Field label="Date line" htmlFor="ct-date">
            <TextInput id="ct-date" value={spec.dateLabel} onChange={(e) => patch({ dateLabel: e.target.value })} />
          </Field>
        </section>

        <section className="space-y-4">
          <TitleBlock title="Signatures" tone="pencil" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor="ct-s1">
              <TextInput id="ct-s1" value={spec.signerName} onChange={(e) => patch({ signerName: e.target.value })} />
            </Field>
            <Field label="Role" htmlFor="ct-s1r">
              <TextInput id="ct-s1r" value={spec.signerRole} onChange={(e) => patch({ signerRole: e.target.value })} />
            </Field>
            <Field label="Name (2nd)" htmlFor="ct-s2">
              <TextInput id="ct-s2" value={spec.secondSignerName} onChange={(e) => patch({ secondSignerName: e.target.value })} />
            </Field>
            <Field label="Role (2nd)" htmlFor="ct-s2r">
              <TextInput id="ct-s2r" value={spec.secondSignerRole} onChange={(e) => patch({ secondSignerRole: e.target.value })} />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <TitleBlock title="Style" />
          <Field label="Accent">
            <ColorSwatches value={spec.accentHex} onChange={(accentHex) => patch({ accentHex })} presets={ACCENTS} />
          </Field>
          <Checkbox label="Seal" checked={spec.showSeal} onChange={(showSeal) => patch({ showSeal })} />
        </section>
      </div>

      <div className="min-w-0">
        <div className="lg:sticky lg:top-20">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] text-faint">Live preview</h2>
            <span className="font-mono text-[11px] text-faint">A4 landscape</span>
          </div>
          <PdfPreview bytes={bytes} className="max-h-[78vh]" />
        </div>
      </div>
    </div>
  );
}
