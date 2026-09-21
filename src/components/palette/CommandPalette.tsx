import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { Dices, Search } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { Badge, Kbd } from '@/components/ui/misc';
import { fuzzyToolScore, type SearchableTool } from '@/lib/fuzzy';
import { useFavorites, useRecentTools } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toolRegistry } from '@/tools/registry';
import { CATEGORIES, type ToolDefinition } from '@/tools/types';

interface PaletteApi {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PaletteContext = createContext<PaletteApi | null>(null);

export function useCommandPalette(): PaletteApi {
  const ctx = useContext(PaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used inside <PaletteProvider>');
  return ctx;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
  );
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <PaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette open={open} setOpen={setOpen} />
    </PaletteContext.Provider>
  );
}

const groupClasses =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-faint';

function ToolItem({
  tool,
  scope,
  onNavigate,
}: {
  tool: ToolDefinition;
  scope: string;
  onNavigate: (id: string) => void;
}) {
  const Icon = tool.icon;
  return (
    <Command.Item
      value={`${scope}~${tool.id}`}
      onSelect={() => onNavigate(tool.id)}
      className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm data-[selected=true]:bg-ink-tint data-[selected=true]:outline data-[selected=true]:outline-1 data-[selected=true]:outline-ink/20"
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md border',
          tool.category === 'developer'
            ? 'border-ink/20 bg-ink-tint text-ink'
            : 'border-pencil/20 bg-pencil-soft text-pencil',
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-fg">{tool.name}</span>
        <span className="block truncate text-xs text-muted">{tool.blurb}</span>
      </span>
      {tool.status === 'planned' ? (
        <Badge>planned</Badge>
      ) : (
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-faint">
          <span aria-hidden className="size-1 rounded-full bg-highlight" />
          {tool.category === 'developer' ? 'Developer' : 'Everyday'}
        </span>
      )}
    </Command.Item>
  );
}

function CommandPalette({ open, setOpen }: PaletteApi) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const favorites = useFavorites();
  const recents = useRecentTools();

  // cmdk matches on the item value. Values are scoped ("fav~<id>") so a tool can
  // appear in Favorites and in its category group without breaking arrow-key selection.
  const searchIndex = useMemo(() => {
    const index = new Map<string, SearchableTool>();
    for (const tool of toolRegistry) {
      index.set(tool.id, { name: tool.name, keywords: tool.keywords, blurb: tool.blurb });
    }
    return index;
  }, []);

  const filter = useCallback(
    (value: string, search: string) => {
      if (!search.trim()) return 1;
      const id = value.includes('~') ? value.slice(value.indexOf('~') + 1) : value;
      const entry = searchIndex.get(id);
      if (!entry) return 0;
      return fuzzyToolScore(search, entry);
    },
    [searchIndex],
  );

  const navigateToTool = useCallback(
    (id: string) => {
      setOpen(false);
      navigate(`/tools/${id}`);
    },
    [navigate, setOpen],
  );

  const surprise = useCallback(() => {
    const ready = toolRegistry.filter((tool) => tool.status === 'ready');
    const pick = ready[Math.floor(Math.random() * ready.length)];
    if (pick) navigateToTool(pick.id);
  }, [navigateToTool]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const byId = useMemo(() => new Map(toolRegistry.map((tool) => [tool.id, tool])), []);
  const favoriteTools = favorites.map((id) => byId.get(id)).filter((t): t is ToolDefinition => t !== undefined);
  const recentTools = recents.map((id) => byId.get(id)).filter((t): t is ToolDefinition => t !== undefined);
  const developerTools = toolRegistry.filter((tool) => tool.category === 'developer');
  const everydayTools = toolRegistry.filter((tool) => tool.category === 'everyday');
  const readyCount = toolRegistry.filter((tool) => tool.status === 'ready').length;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[oklch(0.18_0.03_266_/_0.5)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_150ms_ease-out]" />
        <DialogPrimitive.Content
          className="fixed left-1/2 top-[10vh] z-50 w-[min(660px,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-lg border border-line-strong bg-surface shadow-2xl shadow-[oklch(0.15_0.04_266_/_0.35)] outline-none data-[state=open]:animate-[palette-in_160ms_ease-out]"
        >
          <DialogPrimitive.Title className="sr-only">Search tools</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Fuzzy search across every LocalCraft tool.
          </DialogPrimitive.Description>

          <Command loop filter={filter} className="flex max-h-[min(70vh,560px)] flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-faint" aria-hidden />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search tools — try “receipt”, “uuid”, “cron”…"
                className="h-12 w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-faint"
              />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search" className="cursor-pointer">
                <Kbd>esc</Kbd>
              </button>
            </div>

            <Command.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              <Command.Empty className="px-3 py-10 text-center text-sm text-muted">
                No tool matches “{query}”. The registry doubles as the roadmap, so it may show up in a later release.
              </Command.Empty>

              {query === '' && favoriteTools.length > 0 && (
                <Command.Group heading="Favorites" className={groupClasses}>
                  {favoriteTools.map((tool) => (
                    <ToolItem key={tool.id} tool={tool} scope="fav" onNavigate={navigateToTool} />
                  ))}
                </Command.Group>
              )}

              {query === '' && recentTools.length > 0 && (
                <Command.Group heading="Recent" className={groupClasses}>
                  {recentTools.map((tool) => (
                    <ToolItem key={tool.id} tool={tool} scope="rec" onNavigate={navigateToTool} />
                  ))}
                </Command.Group>
              )}

              <Command.Group heading={CATEGORIES.developer.label} className={groupClasses}>
                {developerTools.map((tool) => (
                  <ToolItem key={tool.id} tool={tool} scope="dev" onNavigate={navigateToTool} />
                ))}
              </Command.Group>

              <Command.Group heading={CATEGORIES.everyday.label} className={groupClasses}>
                {everydayTools.map((tool) => (
                  <ToolItem key={tool.id} tool={tool} scope="eve" onNavigate={navigateToTool} />
                ))}
              </Command.Group>
            </Command.List>

            <div className="flex items-center justify-between gap-4 border-t border-line bg-raised/60 px-4 py-2 font-mono text-[11px] text-faint">
              <span className="flex items-center gap-3">
                <span className="hidden items-center gap-1 sm:flex">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> move
                </span>
                <span className="flex items-center gap-1">
                  <Kbd>↵</Kbd> open
                </span>
                <button
                  type="button"
                  onClick={surprise}
                  className="inline-flex cursor-pointer items-center gap-1 rounded border border-line bg-surface px-1.5 py-0.5 text-faint transition-colors hover:text-fg"
                >
                  <Dices className="size-3" aria-hidden />
                  surprise me
                </button>
              </span>
              <span className="hidden sm:inline">
                {readyCount} of {toolRegistry.length} tools ready · runs offline
              </span>
              <span className="sm:hidden">
                {readyCount}/{toolRegistry.length} ready
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
