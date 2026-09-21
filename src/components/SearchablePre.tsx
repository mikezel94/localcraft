import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { findMatches } from '@/lib/find';
import { cn } from '@/lib/utils';

/**
 * A <pre>-style output with a find box: match count, previous/next stepping,
 * and the active match scrolled into view. Without a query the output renders
 * through the optional syntax highlighter; while searching it renders as
 * plain text so matches can be marked exactly.
 */
export function SearchablePre({
  text,
  highlight,
  label,
  className,
}: {
  text: string;
  highlight?: (text: string) => string;
  label: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [current, setCurrent] = useState(0);
  const activeRef = useRef<HTMLElement>(null);

  const needle = query.trim();
  const offsets = useMemo(() => findMatches(text, needle), [text, needle]);

  useEffect(() => {
    setCurrent(0);
  }, [needle, text]);

  useEffect(() => {
    if (needle) activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [current, needle]);

  const step = (delta: number) =>
    setCurrent((i) => (offsets.length === 0 ? 0 : (i + delta + offsets.length) % offsets.length));

  const segments: { key: number; text: string; mark: boolean; active: boolean }[] = [];
  if (needle && offsets.length > 0) {
    let cursor = 0;
    offsets.forEach((at, i) => {
      if (at > cursor) segments.push({ key: i * 2, text: text.slice(cursor, at), mark: false, active: false });
      segments.push({ key: i * 2 + 1, text: text.slice(at, at + needle.length), mark: true, active: i === current });
      cursor = at + needle.length;
    });
    if (cursor < text.length) segments.push({ key: -1, text: text.slice(cursor), mark: false, active: false });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') step(e.shiftKey ? -1 : 1);
            }}
            placeholder="Find in output…"
            aria-label={`Find in ${label}`}
            className="w-full rounded-md border border-line bg-surface py-1.5 pl-8 pr-8 text-[13px] text-fg transition-colors placeholder:text-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear find"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-faint transition-colors hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
        {needle ? (
          <span className="flex shrink-0 items-center gap-1" role="group" aria-label="Find navigation">
            <span aria-live="polite" className="min-w-12 text-center font-mono text-[11px] text-faint">
              {offsets.length === 0 ? '0 found' : `${current + 1}/${offsets.length}`}
            </span>
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={offsets.length === 0}
              aria-label="Previous match"
              className="cursor-pointer rounded border border-line bg-surface p-1 text-muted transition-colors hover:text-fg disabled:opacity-40"
            >
              <ChevronUp className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={offsets.length === 0}
              aria-label="Next match"
              className="cursor-pointer rounded border border-line bg-surface p-1 text-muted transition-colors hover:text-fg disabled:opacity-40"
            >
              <ChevronDown className="size-3.5" aria-hidden />
            </button>
          </span>
        ) : null}
      </div>

      {needle ? (
        <pre
          aria-label={label}
          className={cn('max-h-[28rem] overflow-auto rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px] leading-relaxed text-fg', className)}
        >
          {offsets.length === 0
            ? text
            : segments.map((segment) =>
                segment.mark ? (
                  <mark
                    key={segment.key}
                    ref={segment.active ? activeRef : undefined}
                    className={segment.active ? 'rounded-[3px] bg-highlight px-0.5 text-fg' : 'rounded-[3px] bg-highlight/50 px-0.5 text-fg'}
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={segment.key}>{segment.text}</span>
                ),
              )}
        </pre>
      ) : highlight ? (
        <pre
          aria-label={label}
          className={cn('max-h-[28rem] overflow-auto rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px] leading-relaxed', className)}
          dangerouslySetInnerHTML={{ __html: highlight(text) }}
        />
      ) : (
        <pre
          aria-label={label}
          className={cn('max-h-[28rem] overflow-auto rounded-md border border-line bg-raised/50 p-4 font-mono text-[13px] leading-relaxed text-fg', className)}
        >
          {text}
        </pre>
      )}
    </div>
  );
}
