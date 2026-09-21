import { ArrowUpRight, Star } from 'lucide-react';
import { Link } from 'react-router';

import { toggleFavorite, useFavorites } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getGroup } from '@/tools/registry';
import type { ToolDefinition } from '@/tools/types';

const cornerMarks = [
  '-top-[5px] -left-[5px] border-t border-l',
  '-top-[5px] -right-[5px] border-t border-r',
  '-bottom-[5px] -left-[5px] border-b border-l',
  '-bottom-[5px] -right-[5px] border-b border-r',
];

export function StarButton({ tool, className }: { tool: ToolDefinition; className?: string }) {
  const favorite = useFavorites().includes(tool.id);
  return (
    <button
      type="button"
      aria-label={favorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
      aria-pressed={favorite}
      onClick={() => toggleFavorite(tool.id)}
      className={cn(
        'cursor-pointer rounded-md p-1.5 transition-colors hover:bg-raised hover:text-ink focus-visible:text-ink',
        favorite ? 'text-highlight' : 'text-faint',
        className,
      )}
    >
      <Star className={cn('size-4', favorite && 'fill-highlight text-highlight')} aria-hidden />
    </button>
  );
}

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  const Icon = tool.icon;
  const isReady = tool.status === 'ready';
  const groupLabel = getGroup(tool.group)?.label;
  return (
    <div className="group relative">
      <Link
        to={`/tools/${tool.id}`}
        aria-label={`${tool.name} — ${tool.blurb}`}
        className={cn(
          'card-hover flex h-full flex-col gap-3 rounded-md border p-4',
          isReady
            ? 'border-line bg-surface hover:border-line-strong'
            : 'border-dashed border-line bg-transparent hover:border-line-strong',
        )}
      >
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-md border shadow-[var(--shadow-sm)]',
              tool.category === 'developer'
                ? 'border-ink/20 bg-ink-tint text-ink'
                : 'border-pencil/20 bg-pencil-soft text-pencil',
            )}
          >
            <Icon className="size-4.5" aria-hidden />
          </span>
          <ArrowUpRight
            aria-hidden
            className="size-4 text-faint opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
          />
        </span>
        <span className="block pr-6">
          <span className="font-medium text-fg">{tool.name}</span>
          <span className="mt-1 block text-[13px] leading-snug text-muted">{tool.blurb}</span>
        </span>
        <span className="mt-auto flex items-center gap-1.5 pt-1 font-mono text-[11px] text-faint">
          <span
            aria-hidden
            className={cn('size-1.5 rounded-full', isReady ? 'bg-highlight' : 'bg-line-strong')}
          />
          {isReady ? 'ready' : 'planned'}
          {groupLabel ? (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{groupLabel}</span>
            </>
          ) : null}
        </span>
      </Link>
      {/* Crop marks surface on hover/focus — the drafting frame. */}
      {cornerMarks.map((position) => (
        <span
          key={position}
          aria-hidden
          className={cn(
            'pointer-events-none absolute size-2 border-ink opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100',
            position,
          )}
        />
      ))}
      <StarButton tool={tool} className="absolute right-2.5 top-2.5 z-10" />
    </div>
  );
}
