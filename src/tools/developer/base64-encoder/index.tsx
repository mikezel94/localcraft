import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, Segmented, TextArea, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';
import { pickFile } from '@/lib/files';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.trim().replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function DecodeDownloadButton({ decodeInput, decodeName }: { decodeInput: string; decodeName: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="space-y-2">
      <Button
        disabled={!decodeInput.trim()}
        onClick={() => {
          try {
            downloadFile(base64ToBytes(decodeInput), decodeName || 'decoded.bin', 'application/octet-stream');
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        Decode & download
      </Button>
      {failed ? (
        <p role="alert" className="font-mono text-[12px] text-muted">✗ That is not valid Base64.</p>
      ) : null}
    </div>
  );
}

export default function Base64Encoder() {
  const [tab, setTab] = useState<'text' | 'file'>('text');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('Everything sits in your browser.');

  const [fileResult, setFileResult] = useState<{ name: string; size: number; base64: string } | null>(null);
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeName, setDecodeName] = useState('decoded.bin');

  const textOutput = useMemo(() => {
    try {
      return direction === 'encode' ? bytesToBase64(new TextEncoder().encode(input)) : new TextDecoder().decode(base64ToBytes(input));
    } catch {
      return null;
    }
  }, [direction, input]);

  const textFailed = input.length > 0 && textOutput === null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Input kind"
          options={[
            { value: 'text', label: 'Text' },
            { value: 'file', label: 'File' },
          ]}
          value={tab}
          onChange={setTab}
          className="w-44!"
        />
        {tab === 'text' ? (
          <Segmented
            ariaLabel="Direction"
            options={[
              { value: 'encode', label: 'Encode' },
              { value: 'decode', label: 'Decode' },
            ]}
            value={direction}
            onChange={setDirection}
            className="w-44!"
          />
        ) : null}
      </div>

      {tab === 'text' ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <TitleBlock title="Input" />
            <Field label={direction === 'encode' ? 'Plain text' : 'Base64'} htmlFor="b64-in">
              <TextArea
                id="b64-in"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-56 font-mono text-[13px]"
                spellCheck={false}
              />
            </Field>
            {textFailed ? (
              <p role="alert" className="font-mono text-[12px] text-muted">✗ That is not valid Base64.</p>
            ) : null}
          </div>
          <div className="space-y-4">
            <TitleBlock title={direction === 'encode' ? 'Base64' : 'Plain text'} />
            {textOutput ? (
              <>
                <TextArea value={textOutput} readOnly aria-label={direction === 'encode' ? 'Base64 output' : 'Decoded text'} className="min-h-56 font-mono text-[13px]" spellCheck={false} />
                <div className="flex gap-2">
                  <CopyButton text={textOutput} />
                  {direction === 'decode' ? (
                    <Button onClick={() => textOutput && downloadFile(base64ToBytes(textOutput), 'decoded.bin', 'application/octet-stream')}>
                      Download bytes
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
                Result appears here as you type.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <TitleBlock title="File → Base64" />
            <p className="max-w-md text-sm text-muted">
              The file is read into memory on this machine and encoded. Nothing is uploaded.
            </p>
            <Button
              onClick={() => {
                void pickFile().then(async (file) => {
                  if (!file) return;
                  const bytes = new Uint8Array(await file.arrayBuffer());
                  setFileResult({ name: file.name, size: bytes.length, base64: bytesToBase64(bytes) });
                });
              }}
            >
              Choose file
            </Button>
            {fileResult ? (
              <div className="space-y-2">
                <p className="font-mono text-[12px] text-muted">
                  {fileResult.name} ({formatBytes(fileResult.size)}) → {formatBytes(fileResult.base64.length)} encoded
                </p>
                <div className="flex gap-2">
                  <CopyButton text={fileResult.base64} label="Copy Base64" />
                  <Button onClick={() => downloadFile(fileResult.base64, `${fileResult.name}.base64.txt`, 'text/plain')}>
                    Download .txt
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <TitleBlock title="Base64 → File" tone="pencil" />
            <Field label="Base64 (with or without data: prefix)" htmlFor="b64-file-in">
              <TextArea
                id="b64-file-in"
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                className="min-h-40 font-mono text-[12px]"
                spellCheck={false}
              />
            </Field>
            <Field label="Output filename" htmlFor="b64-file-name">
              <TextInput id="b64-file-name" value={decodeName} onChange={(e) => setDecodeName(e.target.value)} />
            </Field>
            <DecodeDownloadButton decodeInput={decodeInput} decodeName={decodeName} />
          </div>
        </div>
      )}
    </div>
  );
}
