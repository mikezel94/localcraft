import { Check, Copy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CopyButton({
  text,
  label = 'Copy',
  className,
  ariaLabel,
}: {
  text: string;
  label?: string;
  className?: string;
  /** Screen-reader name for icon-only buttons (when label is ""). */
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      className={className}
      aria-label={ariaLabel ?? (label ? undefined : 'Copy to clipboard')}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      disabled={!text}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? 'Copied' : label}
    </Button>
  );
}

export function Kbd({ children, className, bare = false }: { children: ReactNode; className?: string; bare?: boolean }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded border px-1.5 font-mono text-[11px] font-medium',
        !bare && 'border-line bg-raised text-muted',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ink' | 'pencil';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        tone === 'neutral' && 'border-line bg-raised text-muted',
        tone === 'ink' && 'border-ink/25 bg-ink-tint text-ink',
        tone === 'pencil' && 'border-pencil/25 bg-pencil-soft text-pencil',
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Section header styled like an engineering-drawing title block. */
export function TitleBlock({
  title,
  note,
  tone = 'ink',
}: {
  title: string;
  note?: string;
  tone?: 'ink' | 'pencil';
}) {
  return (
    <div className="inline-flex items-stretch border border-line bg-surface">
      <span aria-hidden className={cn('w-1.5', tone === 'pencil' ? 'bg-pencil' : 'bg-ink')} />
      <div className="flex items-baseline gap-3 px-3 py-1.5">
        <h2 className="font-display text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
        {note ? <span className="font-mono text-[11px] text-faint">{note}</span> : null}
      </div>
    </div>
  );
}

export function ColorSwatches({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (value: string) => void;
  presets: string[];
}) {
  const active = value.toLowerCase();
  return (
    <div className="flex items-center gap-2">
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={`Accent color ${color}`}
          aria-pressed={color.toLowerCase() === active}
          onClick={() => onChange(color)}
          style={{ backgroundColor: color }}
          className={cn(
            'size-6 cursor-pointer rounded-full border transition-transform',
            color.toLowerCase() === active ? 'scale-110 border-fg ring-2 ring-fg/25' : 'border-line hover:scale-110',
          )}
        />
      ))}
      <input
        type="color"
        value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#3e45ce'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Custom accent color"
        className="size-6 cursor-pointer rounded-full border border-line bg-transparent p-0"
      />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-line-strong bg-raised/40 px-6 py-14 text-center">
      <Icon className="size-6 text-faint" />
      <p className="font-display text-[15px] font-semibold text-fg">{title}</p>
      <div className="max-w-sm text-sm text-muted">{children}</div>
    </div>
  );
}
