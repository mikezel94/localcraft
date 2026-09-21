import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { Seo } from '@/components/Seo';
import { ToolCard } from '@/components/ToolCard';
import { EmptyState, TitleBlock } from '@/components/ui/misc';
import { seoForPath } from '@/lib/seoData';
import { getGroup, readyToolCount, toolRegistry, TOOL_GROUPS } from '@/tools/registry';
import { CATEGORIES, type CategoryId, type ToolDefinition } from '@/tools/types';
import { cn } from '@/lib/utils';

function matchesQuery(tool: ToolDefinition, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const groupLabel = getGroup(tool.group)?.label.toLowerCase() ?? '';
  const haystack = `${tool.name}\n${tool.blurb}\n${tool.keywords.join(' ')}\n${groupLabel}`.toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

/** Permanent, indexable page for one category — /developer and /everyday. */
export function CategoryPage({ category }: { category: CategoryId }) {
  const [query, setQuery] = useState('');
  const seo = useMemo(() => seoForPath(`/${category}`), [category]);
  const info = CATEGORIES[category];
  const groups = TOOL_GROUPS.filter((group) => group.category === category);
  const total = toolRegistry.filter((tool) => tool.category === category).length;
  const ready = toolRegistry.filter((tool) => tool.category === category && tool.status === 'ready').length;
  const trimmed = query.trim();
  const shown = toolRegistry.filter((tool) => tool.category === category && matchesQuery(tool, trimmed)).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <Seo data={seo} />
      <nav aria-label="Breadcrumb" className="font-mono text-[12px] text-faint">
        <Link to="/" className="transition-colors hover:text-fg">
          localcraft
        </Link>
        <span className="px-1.5">/</span>
        <span className={category === 'developer' ? 'text-ink' : 'text-pencil'}>{info.label}</span>
      </nav>

      <header className="mt-5 border-b border-line pb-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-semibold tracking-tight text-fg">{info.label}</h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">
              {ready} of {total} tools ready — every one runs entirely in your browser. Nothing is uploaded, ever.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Filter ${info.label.toLowerCase()}…`}
              aria-label={`Filter ${info.label}`}
              className="w-full rounded-md border border-line bg-surface py-2 pl-9 pr-9 text-sm text-fg transition-colors placeholder:text-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-faint transition-colors hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Jump to group">
          {groups.map((group) => {
            const count = toolRegistry.filter((tool) => tool.group === group.id && matchesQuery(tool, trimmed)).length;
            if (count === 0) return null;
            return (
              <a
                key={group.id}
                href={`#group-${group.id}`}
                className="rounded-md border border-line bg-surface px-2.5 py-1 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                {group.label}
                <span className="ml-1.5 font-mono text-[11px] opacity-70">{count}</span>
              </a>
            );
          })}
        </div>
        {trimmed ? (
          <p className="mt-3 font-mono text-[11px] text-faint" aria-live="polite">
            {shown} of {total} match “{trimmed}”
          </p>
        ) : null}
      </header>

      {groups.map((group) => {
        const tools = toolRegistry.filter((tool) => tool.group === group.id && matchesQuery(tool, trimmed));
        if (tools.length === 0) return null;
        return (
          <section key={group.id} id={`group-${group.id}`} className="mt-10 scroll-mt-20">
            <TitleBlock
              title={group.label}
              note={`${tools.length} tool${tools.length === 1 ? '' : 's'}`}
              tone={category === 'developer' ? 'ink' : 'pencil'}
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        );
      })}

      {trimmed && shown === 0 ? (
        <div className="mt-10">
          <EmptyState icon={Search} title={`Nothing in ${info.label} matches “${trimmed}”`}>
            Try fewer words, or{' '}
            <button
              type="button"
              onClick={() => setQuery('')}
              className="cursor-pointer underline decoration-line-strong underline-offset-2 hover:text-fg"
            >
              clear the filter
            </button>
            .
          </EmptyState>
        </div>
      ) : null}

      <div className={cn('flex flex-wrap items-center justify-between gap-2')}>
        <p className="mt-14 font-mono text-[11px] text-faint">
          {readyToolCount} of {toolRegistry.length} tools built overall · <Link to="/" className="hover:text-fg">all tools</Link>
        </p>
        <a href="#main" className="mt-14 font-mono text-[11px] text-faint underline decoration-line-strong underline-offset-2 hover:text-fg">
          Back to top ↑
        </a>
      </div>
    </div>
  );
}
