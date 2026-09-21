import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, Segmented, TextArea, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';
import { pickFile } from '@/lib/files';
import { decryptBytes, encryptBytes, fromBase64, toBase64 } from './crypto';

export default function FileEncryptor() {
  const [tab, setTab] = useState<'file' | 'text'>('file');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ kind: 'error' | 'done' | 'busy'; message: string } | null>(null);

  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState('');

  const passwordsDiffer = passwordAgain.length > 0 && password !== passwordAgain;
  const canFile = Boolean(file) && password.length >= 8 && !passwordsDiffer;

  const runFile = async (direction: 'encrypt' | 'decrypt') => {
    if (!file) return;
    setStatus({ kind: 'busy', message: `${direction === 'encrypt' ? 'Encrypting' : 'Decrypting'}…` });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const output =
        direction === 'encrypt' ? await encryptBytes(bytes, password) : await decryptBytes(bytes, password);
      const name =
        direction === 'encrypt'
          ? `${file.name}.enc`
          : file.name.replace(/\.enc$/, '') || 'decrypted.bin';
      downloadFile(output, name, 'application/octet-stream');
      setStatus({ kind: 'done', message: `${direction === 'encrypt' ? 'Encrypted' : 'Decrypted'} → ${name} (${formatBytes(output.length)})` });
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Operation failed.' });
    }
  };

  const runText = (direction: 'encrypt' | 'decrypt') => {
    if (password.length < 8) {
      setStatus({ kind: 'error', message: 'Use a password of at least 8 characters.' });
      return;
    }
    setStatus({ kind: 'busy', message: direction === 'encrypt' ? 'Encrypting…' : 'Decrypting…' });
    let bytes: Uint8Array;
    try {
      bytes = direction === 'encrypt' ? new TextEncoder().encode(textInput) : fromBase64(textInput);
    } catch {
      setStatus({ kind: 'error', message: 'That input is not valid LocalCraft ciphertext.' });
      return;
    }
    void (direction === 'encrypt' ? encryptBytes(bytes, password) : decryptBytes(bytes, password)).then(
      (out) => {
        setTextOutput(direction === 'encrypt' ? toBase64(out) : new TextDecoder().decode(out));
        setStatus({ kind: 'done', message: 'Done.' });
      },
      (error) => {
        setStatus({
          kind: 'error',
          message:
            direction === 'decrypt'
              ? 'Decryption failed — wrong password or corrupted input.'
              : error instanceof Error
                ? error.message
                : 'Encryption failed.',
        });
      },
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Segmented
        ariaLabel="What to encrypt"
        options={[
          { value: 'file', label: 'File' },
          { value: 'text', label: 'Text' },
        ]}
        value={tab}
        onChange={setTab}
        className="w-44!"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Password" htmlFor="enc-pass">
          <TextInput id="enc-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        {tab === 'file' ? (
          <Field label="Repeat password" htmlFor="enc-pass2" error={passwordsDiffer ? 'Passwords do not match.' : undefined}>
            <TextInput id="enc-pass2" type="password" value={passwordAgain} onChange={(e) => setPasswordAgain(e.target.value)} autoComplete="new-password" />
          </Field>
        ) : null}
      </div>
      <p className="text-xs leading-snug text-faint">
        AES-256-GCM with a PBKDF2 key (250,000 rounds). There is no recovery — if you forget the password, the data
        is gone. The password never leaves this tab.
      </p>

      {tab === 'file' ? (
        <>
          <TitleBlock title="File" tone="pencil" />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void pickFile().then(setFile)}>Choose file…</Button>
            {file ? (
              <span className="font-mono text-[12.5px] text-muted">
                {file.name} · {formatBytes(file.size)}
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="primary" disabled={!canFile || status?.kind === 'busy'} onClick={() => void runFile('encrypt')}>
              Encrypt & download
            </Button>
            <Button variant="primary" disabled={!canFile || status?.kind === 'busy'} onClick={() => void runFile('decrypt')}>
              Decrypt & download
            </Button>
          </div>
        </>
      ) : (
        <>
          <TitleBlock title="Text" tone="pencil" />
          <Field label="Plaintext" htmlFor="enc-text-in">
            <TextArea id="enc-text-in" value={textInput} onChange={(e) => setTextInput(e.target.value)} className="min-h-24" />
          </Field>
          <div className="flex gap-2">
            <Button onClick={() => runText('encrypt')} disabled={!textInput || password.length < 8}>
              Encrypt → Base64
            </Button>
            <Button onClick={() => runText('decrypt')} disabled={!textInput || password.length < 8}>
              Decrypt from Base64
            </Button>
          </div>
          {textOutput ? (
            <>
              <Field label="Result" htmlFor="enc-text-out">
                <TextArea id="enc-text-out" value={textOutput} readOnly className="min-h-24 font-mono text-[12.5px]" />
              </Field>
              <CopyButton text={textOutput} />
            </>
          ) : null}
        </>
      )}

      {status ? (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted"
        >
          {status.kind === 'error' ? '✗ ' : '· '}
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
