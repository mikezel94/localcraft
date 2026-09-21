import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/misc';
import { Field, Segmented, Select, TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { downloadFile } from '@/lib/utils';
import { pickFile } from '@/lib/files';

type Content = 'text' | 'url' | 'wifi';

function wifiString(ssid: string, password: string, encryption: string): string {
  const escape = (value: string) => value.replace(/([\\;,:"])/g, '\\$1');
  return `WIFI:T:${encryption};S:${escape(ssid)};${encryption !== 'nopass' ? `P:${escape(password)};` : ''};`;
}

export default function QrTools() {
  const [tab, setTab] = useState<'generate' | 'scan'>('generate');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [kind, setKind] = useState<Content>('url');
  const [text, setText] = useState('https://localcraft.app');
  const [ssid, setSsid] = useState('Nordwind Guest');
  const [wifiPassword, setWifiPassword] = useState('');
  const [encryption, setEncryption] = useState('WPA');
  const [size, setSize] = useState('320');
  const [dark, setDark] = useState('#1a1f33');
  const [light, setLight] = useState('#ffffff');
  const [logo, setLogo] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const content = kind === 'wifi' ? wifiString(ssid, wifiPassword, encryption) : text;

  // ——— Generator ———
  useEffect(() => {
    if (tab !== 'generate' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    void QRCode.toCanvas(canvas, content || ' ', {
      width: parseInt(size) || 320,
      margin: 2,
      errorCorrectionLevel: logo ? 'H' : 'M', // high ECC keeps the code readable under a logo
      color: { dark, light },
    }).then(() => {
      if (!logo || !canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const image = new Image();
      image.onload = () => {
        const box = Math.round(canvas.width * 0.22);
        const x = (canvas.width - box) / 2;
        ctx.fillStyle = light;
        ctx.fillRect(x - 6, x - 6, box + 12, box + 12);
        ctx.drawImage(image, x, x, box, box);
      };
      image.src = logo;
    });
  }, [tab, content, size, dark, light, logo]);

  const startScan = async () => {
    if (scanning) return;
    setScanError(null);
    const Detector = (window as unknown as { BarcodeDetector?: new (options?: { formats?: string[] }) => { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector) {
      setScanError('This browser has no built-in barcode detector — try Chrome or Edge on desktop/Android.');
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = streamRef.current;
      await video.play();
      setScanning(true);
      const detector = new Detector({ formats: ['qr_code'] });
      const tick = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const hits = await detector.detect(videoRef.current);
          if (hits.length > 0) {
            setScanResult(hits[0]!.rawValue);
            stopScan();
            return;
          }
        } catch {
          /* frame not ready — keep polling */
        }
        requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      setScanError('Camera access was refused — scanning needs the camera permission.');
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopScan = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopScan, []);

  return (
    <div className="space-y-6">
      <Segmented
        ariaLabel="QR mode"
        options={[
          { value: 'generate', label: 'Generate' },
          { value: 'scan', label: 'Scan with camera' },
        ]}
        value={tab}
        onChange={(next) => {
          if (next !== 'scan') stopScan();
          setTab(next as 'generate' | 'scan');
        }}
        className="w-72!"
      />

      {tab === 'generate' ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <TitleBlock title="Content" />
            <Segmented
              ariaLabel="Content type"
              options={[
                { value: 'url', label: 'Link' },
                { value: 'text', label: 'Text' },
                { value: 'wifi', label: 'Wi-Fi' },
              ]}
              value={kind}
              onChange={setKind}
            />
            {kind === 'wifi' ? (
              <>
                <Field label="Network name (SSID)" htmlFor="qr-ssid">
                  <TextInput id="qr-ssid" value={ssid} onChange={(e) => setSsid(e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Password" htmlFor="qr-pass">
                    <TextInput id="qr-pass" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} />
                  </Field>
                  <Field label="Security" htmlFor="qr-sec">
                    <Select id="qr-sec" value={encryption} onChange={(e) => setEncryption(e.target.value)}>
                      <option value="WPA">WPA/WPA2/WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Open</option>
                    </Select>
                  </Field>
                </div>
              </>
            ) : (
              <Field label={kind === 'url' ? 'URL' : 'Text'} htmlFor="qr-text">
                <TextInput id="qr-text" value={text} onChange={(e) => setText(e.target.value)} className="font-mono text-[13px]" />
              </Field>
            )}

            <TitleBlock title="Style" tone="pencil" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Size (px)" htmlFor="qr-size">
                <Select id="qr-size" value={size} onChange={(e) => setSize(e.target.value)}>
                  {['256', '320', '512', '768'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Colors" htmlFor="qr-dark">
                <div className="flex gap-2">
                  <input id="qr-dark" type="color" value={dark} onChange={(e) => setDark(e.target.value)} aria-label="Foreground color" className="size-10 cursor-pointer rounded-md border border-line bg-transparent p-1" />
                  <input type="color" value={light} onChange={(e) => setLight(e.target.value)} aria-label="Background color" className="size-10 cursor-pointer rounded-md border border-line bg-transparent p-1" />
                </div>
              </Field>
            </div>
            <Field label="Logo (optional, PNG/JPG)" hint="Drawn on a white plate; error correction is raised to compensate.">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    void pickFile('image/png,image/jpeg').then((f) => {
                      if (f) setLogo(URL.createObjectURL(f));
                    })
                  }
                >
                  Choose logo…
                </Button>
                {logo ? (
                  <Button variant="ghost" onClick={() => setLogo(null)}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </Field>
          </div>

          <div className="space-y-4">
            <TitleBlock title="Code" tone="pencil" />
            <div className="flex w-fit items-center justify-center rounded-md border border-line bg-raised/50 p-6">
              <canvas ref={canvasRef} role="img" aria-label="QR code preview" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  const canvas = canvasRef.current;
                  canvas?.toBlob((blob) => blob && downloadFile(blob, 'qr-code.png', 'image/png'));
                }}
              >
                Download PNG
              </Button>
              <CopyButton text={content} label="Copy content" />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-xl space-y-4">
          <TitleBlock title="Camera" tone="pencil" />
          <div className="overflow-hidden rounded-md border border-line bg-raised/50">
            <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" aria-label="Camera preview" />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" disabled={scanning} onClick={() => void startScan()}>
              {scanning ? 'Scanning…' : 'Start scanning'}
            </Button>
            <Button disabled={!scanning} onClick={stopScan}>Stop</Button>
          </div>
          {scanError ? (
            <p role="alert" className="rounded-md border border-line bg-raised px-3 py-2 font-mono text-[12px] text-muted">
              ✗ {scanError}
            </p>
          ) : null}
          {scanResult ? (
            <div className="space-y-2 rounded-md border border-line bg-surface p-4">
              <p className="font-mono text-[11px] text-faint">decoded</p>
              <p className="break-all font-mono text-[13px] text-fg">{scanResult}</p>
              <CopyButton text={scanResult} />
            </div>
          ) : null}
          <p className="text-xs leading-snug text-faint">
            Scanning uses your browser’s built-in barcode detector. The camera feed never leaves this tab.
          </p>
        </div>
      )}
    </div>
  );
}
