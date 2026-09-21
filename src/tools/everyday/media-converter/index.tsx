import { useRef, useState } from 'react';
import type { FFmpeg } from '@ffmpeg/ffmpeg';

import { Button } from '@/components/ui/button';
import { Field, Segmented, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { pickFile } from '@/lib/files';
import { downloadFile } from '@/lib/utils';
import { formatBytes } from '@/lib/files';

type Preset = 'mp4' | 'webm' | 'gif' | 'mp3' | 'wav';

interface Job {
  label: string;
  args: (input: string, output: string) => string[];
  extension: string;
  mime: string;
}

const JOBS: Record<Preset, Job> = {
  mp4: {
    label: 'MP4 (H.264)',
    extension: 'mp4',
    mime: 'video/mp4',
    args: (i, o) => ['-i', i, '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-y', o],
  },
  webm: {
    label: 'WebM (VP9)',
    extension: 'webm',
    mime: 'video/webm',
    args: (i, o) => ['-i', i, '-c:v', 'libvpx-vp9', '-b:v', '1M', '-c:a', 'libopus', '-y', o],
  },
  gif: {
    label: 'Animated GIF',
    extension: 'gif',
    mime: 'image/gif',
    args: (i, o) => ['-i', i, '-vf', 'fps=12,scale=480:-1:flags=lanczos', '-y', o],
  },
  mp3: {
    label: 'MP3 (audio only)',
    extension: 'mp3',
    mime: 'audio/mpeg',
    args: (i, o) => ['-i', i, '-vn', '-c:a', 'libmp3lame', '-q:a', '4', '-y', o],
  },
  wav: {
    label: 'WAV (audio only)',
    extension: 'wav',
    mime: 'audio/wav',
    args: (i, o) => ['-i', i, '-vn', '-c:a', 'pcm_s16le', '-y', o],
  },
};

function fmtSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = (value % 60).toFixed(2).padStart(5, '0');
  return `${String(minutes).padStart(2, '0')}:${seconds}`;
}

export default function MediaConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [preset, setPreset] = useState<Preset>('webm');
  const [trimStart, setTrimStart] = useState('0.0');
  const [trimEnd, setTrimEnd] = useState('');
  const [status, setStatus] = useState<{ kind: 'info' | 'error' | 'done'; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const ensureFfmpeg = async (): Promise<FFmpeg> => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const ffmpeg = new FFmpeg();
    ffmpeg.on('progress', (event: { progress: number }) => {
      if (typeof event.progress === 'number') setProgress(Math.min(100, Math.round(event.progress * 100)));
    });
    // Self-hosted core (copied from node_modules into public/ffmpeg by the build).
    await ffmpeg.load({ coreURL: '/ffmpeg/ffmpeg-core.js', wasmURL: '/ffmpeg/ffmpeg-core.wasm' });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  const open = () =>
    void pickFile('video/*,audio/*').then((picked) => {
      if (!picked) return;
      setFile(picked);
      setStatus(null);
      setProgress(0);
      const media = document.createElement(picked.type.startsWith('video') ? 'video' : 'audio');
      media.preload = 'metadata';
      media.onloadedmetadata = () => {
        setDuration(media.duration || 0);
        setTrimEnd(String((media.duration || 0).toFixed(2)));
      };
      media.src = URL.createObjectURL(picked);
    });

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setStatus({ kind: 'info', message: 'Loading the converter core (one-time, ~25 MB, cached offline after)…' });
    try {
      const ffmpeg = await ensureFfmpeg();
      const job = JOBS[preset];
      const inputName = `input.${file.name.split('.').pop() || 'bin'}`;
      const outputName = `output.${job.extension}`;
      setStatus({ kind: 'info', message: 'Converting…' });
      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
      const trim =
        Number.parseFloat(trimStart) > 0 || (trimEnd !== '' && Number.parseFloat(trimEnd) < duration)
          ? [
              '-ss',
              String(Number.parseFloat(trimStart) || 0),
              ...(trimEnd !== '' && Number.parseFloat(trimEnd) < duration
                ? ['-t', String(Math.max(0.1, Number.parseFloat(trimEnd) - (Number.parseFloat(trimStart) || 0)))]
                : []),
            ]
          : [];
      await ffmpeg.exec([...trim, ...job.args(inputName, outputName)]);
      const data = (await ffmpeg.readFile(outputName)) as Uint8Array;
      downloadFile(data, `${file.name.replace(/\.[^.]+$/, '')}.${job.extension}`, job.mime);
      setStatus({ kind: 'done', message: `Done — ${formatBytes(data.length)}` });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? `Conversion failed: ${error.message}` : 'Conversion failed — this container or codec may not be supported by the wasm build.',
      });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <TitleBlock title="Media" />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void open()}>Open audio/video…</Button>
        {file ? (
          <span className="font-mono text-[12.5px] text-muted">
            {file.name} · {formatBytes(file.size)}
            {duration > 0 ? ` · ${fmtSeconds(duration)}` : ''}
          </span>
        ) : null}
      </div>

      {file ? (
        <>
          <TitleBlock title="Output" tone="pencil" />
          <Segmented
            ariaLabel="Output format"
            options={(Object.keys(JOBS) as Preset[]).map((key) => ({ value: key, label: JOBS[key]!.label.split(' (')[0]! }))}
            value={preset}
            onChange={setPreset}
          />
          <p className="font-mono text-[12px] text-faint">{JOBS[preset]!.label}</p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Trim start (s)" htmlFor="mc-start">
              <TextInput id="mc-start" inputMode="decimal" value={trimStart} onChange={(e) => setTrimStart(e.target.value)} />
            </Field>
            <Field label={`Trim end (s${duration ? `, max ${duration.toFixed(2)}` : ''})`} htmlFor="mc-end">
              <TextInput id="mc-end" inputMode="decimal" value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} />
            </Field>
          </div>

          <Button variant="primary" disabled={busy} onClick={() => void run()}>
            {busy ? `Converting… ${progress > 0 ? `${progress}%` : ''}` : `Convert to ${preset.toUpperCase()}`}
          </Button>
          {busy && progress > 0 ? (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised">
              <div className="h-full bg-ink transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
        </>
      ) : (
        <p className="rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-12 text-center text-sm text-faint">
          Trim and convert media with ffmpeg.wasm — the file is processed entirely in this tab.
        </p>
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
