import { ArrowRight, Dices, Search, Star, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { HeroDrafting } from '@/components/HeroDrafting';
import { useCommandPalette } from '@/components/palette/CommandPalette';
import { PrivacyStamp } from '@/components/PrivacyStamp';
import { Seo } from '@/components/Seo';
import { ToolCard } from '@/components/ToolCard';
import { Button } from '@/components/ui/button';
import { EmptyState, Kbd, TitleBlock } from '@/components/ui/misc';
import { seoForPath } from '@/lib/seoData';
import { clearFavorites, clearRecents, useFavorites, useRecentTools } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getGroup, readyToolCount, toolRegistry, TOOL_GROUPS } from '@/tools/registry';
import { CATEGORIES, type CategoryId, type ToolDefinition } from '@/tools/types';

type Filter = 'all' | CategoryId | 'favorites';

function matchesQuery(tool: ToolDefinition, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const groupLabel = getGroup(tool.group)?.label.toLowerCase() ?? '';
  const haystack = `${tool.name}\n${tool.blurb}\n${tool.keywords.join(' ')}\n${groupLabel}`.toLowerCase();
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

function CategoryBlock({ category, query }: { category: CategoryId; query: string }) {
  const groups = TOOL_GROUPS.filter((group) => group.category === category);
  let shown = 0;
  const sections = groups
    .map((group) => {
      const tools = toolRegistry.filter((tool) => tool.group === group.id && matchesQuery(tool, query));
      if (tools.length === 0) return null;
      shown += tools.length;
      return (
        <section key={group.id} className="mt-10">
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
    })
    .filter(Boolean);
  return { sections, shown };
}

function ShortcutChips({
  tools,
  label,
  onClear,
  clearLabel,
}: {
  tools: ToolDefinition[];
  label: string;
  onClear: () => void;
  clearLabel: string;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-[11px] text-faint">{label}</h2>
        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer font-mono text-[11px] text-faint underline decoration-line-strong underline-offset-2 transition-colors hover:text-fg"
        >
          {clearLabel}
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              to={`/tools/${tool.id}`}
              className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              <Icon className="size-3.5" aria-hidden />
              {tool.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function HomePage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const favorites = useFavorites();
  const recents = useRecentTools();
  const { setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const seo = useMemo(() => seoForPath('/'), []);

  const byId = useMemo(() => new Map(toolRegistry.map((tool) => [tool.id, tool])), []);
  const favoriteTools = favorites.map((id) => byId.get(id)).filter((t): t is ToolDefinition => t !== undefined);
  const recentTools = recents.map((id) => byId.get(id)).filter((t): t is ToolDefinition => t !== undefined);

  const developerCount = toolRegistry.filter((t) => t.category === 'developer').length;
  const everydayCount = toolRegistry.filter((t) => t.category === 'everyday').length;

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All tools', count: toolRegistry.length },
    { id: 'developer', label: CATEGORIES.developer.label, count: developerCount },
    { id: 'everyday', label: CATEGORIES.everyday.label, count: everydayCount },
    { id: 'favorites', label: 'Favorites', count: favorites.length },
  ];

  const trimmedQuery = query.trim();
  const { flatResults, poolSize } = useMemo(() => {
    const pool =
      filter === 'favorites' ? favoriteTools : filter === 'all' ? toolRegistry : toolRegistry.filter((t) => t.category === filter);
    return { flatResults: pool.filter((tool) => matchesQuery(tool, trimmedQuery)), poolSize: pool.length };
  }, [filter, trimmedQuery, favoriteTools]);

  const devBlock = CategoryBlock({ category: 'developer', query: trimmedQuery });
  const eveBlock = CategoryBlock({ category: 'everyday', query: trimmedQuery });

  const surprise = () => {
    const ready = toolRegistry.filter((tool) => tool.status === 'ready');
    const pick = ready[Math.floor(Math.random() * ready.length)];
    if (pick) navigate(`/tools/${pick.id}`);
  };

  const showShortcuts = filter === 'all' && trimmedQuery === '';

  return (
    <div>
      <Seo data={seo} />
      {/* Hero on graph paper */}
      <section className="relative border-b border-line">
        <div aria-hidden className="grid-paper absolute inset-0 [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pt-16">
          <div className="flex items-center gap-14">
            <div className="max-w-2xl">
              <div className="animate-rise">
                <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-muted">
                  <span aria-hidden className="size-1.5 rounded-full bg-highlight" />
                  {readyToolCount} tools on the bench · all offline
                </p>
                <h1 className="mt-4 font-display text-[clamp(2.4rem,5.5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-fg">
                  The toolbox that never phones home.
                </h1>
                <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
                  {readyToolCount} tools ready today for developers and everyday work, running entirely in
                  this tab. Everything sits in your browser — zero servers, 100% private, works offline.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button variant="primary" className="px-4 py-2.5 text-[15px]" onClick={() => setOpen(true)}>
                    <Search className="size-4" aria-hidden />
                    Search tools
                    <Kbd bare className="border-ink-fg/40 text-ink-fg">
                      ⌘K
                    </Kbd>
                  </Button>
                  <Button
                    className="px-4 py-2.5 text-[15px]"
                    onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    Browse the catalog
                  </Button>
                  <button
                    type="button"
                    onClick={surprise}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-2.5 text-sm font-medium text-muted transition-colors hover:text-fg"
                  >
                    <Dices className="size-4" aria-hidden />
                    Surprise me
                  </button>
                </div>
                <div className="mt-10">
                  <PrivacyStamp />
                </div>
              </div>
            </div>
            <HeroDrafting className="hidden shrink-0 lg:block" />
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section id="catalog" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by collection">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  'cursor-pointer rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors',
                  filter === tab.id
                    ? 'border-ink/30 bg-ink-tint text-ink'
                    : 'border-line bg-surface text-muted hover:text-fg',
                )}
              >
                {tab.label}
                <span className="ml-2 font-mono text-[11px] opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative lg:ml-auto lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter the catalog…"
              aria-label="Filter the catalog"
              className="w-full rounded-md border border-line bg-surface py-2 pl-9 pr-9 text-sm text-fg transition-colors placeholder:text-faint focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear catalog filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1 text-faint transition-colors hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {showShortcuts ? (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: 'developer' as CategoryId, count: developerCount, hint: 'JSON, SQL, regex, hashes, cron…' },
                  { id: 'everyday' as CategoryId, count: everydayCount, hint: 'PDFs, images, QR, passwords, loans…' },
                ]
              ).map((card) => (
                <Link
                  key={card.id}
                  to={`/${card.id}`}
                  className={cn(
                    'card-hover flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3.5',
                    'hover:border-line-strong',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn('w-1 self-stretch rounded-full', card.id === 'developer' ? 'bg-ink' : 'bg-pencil')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="font-display text-[15px] font-semibold tracking-tight text-fg">
                        {CATEGORIES[card.id].label}
                      </span>
                      <span className="font-mono text-[11px] text-faint">{card.count} tools</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted">{card.hint}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-faint" aria-hidden />
                </Link>
              ))}
            </div>
            <ShortcutChips tools={recentTools} label="Recently used" onClear={clearRecents} clearLabel="Clear recents" />
            <ShortcutChips tools={favoriteTools} label="Pinned favorites" onClear={clearFavorites} clearLabel="Clear favorites" />
          </>
        ) : null}

        <p className="mt-6 font-mono text-[11px] text-faint">
          Permanent pages:{' '}
          <Link to="/developer" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
            /developer
          </Link>{' '}
          ·{' '}
          <Link to="/everyday" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
            /everyday
          </Link>
          {trimmedQuery ? (
            <span aria-live="polite">
              {' '}
              · {flatResults.length} of {poolSize} match “{trimmedQuery}”
            </span>
          ) : null}
        </p>

        {trimmedQuery !== '' || filter === 'favorites' ? (
          flatResults.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {flatResults.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <EmptyState
                icon={filter === 'favorites' && !trimmedQuery ? Star : Search}
                title={filter === 'favorites' && !trimmedQuery ? 'No favorites yet' : `Nothing matches “${trimmedQuery}”`}
              >
                {filter === 'favorites' && !trimmedQuery ? (
                  'Tap the star on any tool to pin it here — favorites also float to the top of the ⌘K palette.'
                ) : (
                  <span className="inline-flex flex-wrap items-center justify-center gap-2">
                    Try fewer words, or
                    <Button variant="secondary" className="px-2.5 py-1 text-[13px]" onClick={() => setOpen(true)}>
                      search everything with ⌘K
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('');
                        setFilter('all');
                      }}
                      className="cursor-pointer underline decoration-line-strong underline-offset-2 hover:text-fg"
                    >
                      clear the filter
                    </button>
                  </span>
                )}
              </EmptyState>
            </div>
          )
        ) : filter === 'all' ? (
          <>
            {devBlock.sections}
            {eveBlock.sections}
          </>
        ) : (
          <>{(filter === 'developer' ? devBlock : eveBlock).sections}</>
        )}

        <p className="mt-14 text-center font-mono text-[11px] text-faint">
          {readyToolCount} of {toolRegistry.length} tools built · the rest are on the workbench
        </p>
      </section>
    </div>
  );
}
