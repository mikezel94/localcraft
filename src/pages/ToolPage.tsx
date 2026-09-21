import { ArrowLeft, ArrowRight, Check, Link2 } from 'lucide-react';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { PlannedPanel } from '@/components/PlannedPanel';
import { Seo } from '@/components/Seo';
import { StarButton } from '@/components/ToolCard';
import { Badge } from '@/components/ui/misc';
import { seoForPath } from '@/lib/seoData';
import { pushRecent } from '@/lib/store';
import { cn } from '@/lib/utils';
import { getGroup, getTool, toolRegistry } from '@/tools/registry';
import { CATEGORIES } from '@/tools/types';
import { NotFoundPage } from '@/pages/NotFoundPage';

function ToolSkeleton() {
  return (
    <div className="max-w-3xl animate-pulse space-y-3" aria-hidden>
      <div className="h-8 w-2/3 rounded bg-raised" />
      <div className="h-40 rounded bg-raised" />
      <div className="h-40 rounded bg-raised" />
    </div>
  );
}

function CopyLinkButton({ toolName }: { toolName: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        try {
          const url = typeof window !== 'undefined' ? window.location.href : '';
          void navigator.clipboard?.writeText(url).then(
            () => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            },
            () => setCopied(false),
          );
        } catch {
          setCopied(false);
        }
      }}
      aria-live="polite"
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
      {copied ? 'Link copied' : `Copy link to ${toolName}`}
    </button>
  );
}

function RelatedTools({ toolId, groupId }: { toolId: string; groupId: string }) {
  const siblings = toolRegistry.filter((tool) => tool.group === groupId && tool.id !== toolId);
  if (siblings.length === 0) return null;
  return (
    <div className="mt-12 border-t border-line pt-6">
      <h2 className="font-mono text-[11px] text-faint">More in {getGroup(groupId)?.label}</h2>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {siblings.map((tool) => {
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

function PrevNext({ toolId, category }: { toolId: string; category: string }) {
  const peers = useMemo(() => toolRegistry.filter((tool) => tool.category === category), [category]);
  const index = peers.findIndex((tool) => tool.id === toolId);
  if (index < 0) return null;
  const prev = index > 0 ? peers[index - 1] : undefined;
  const next = index >= 0 && index < peers.length - 1 ? peers[index + 1] : undefined;
  if (!prev && !next) return null;
  return (
    <nav aria-label="More tools" className="mt-8 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          to={`/tools/${prev.id}`}
          className="group flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong"
        >
          <ArrowLeft className="size-4 shrink-0 text-faint transition-transform group-hover:-translate-x-0.5" aria-hidden />
          <span className="min-w-0">
            <span className="block font-mono text-[11px] text-faint">Previous</span>
            <span className="block truncate text-sm font-medium text-fg">{prev.name}</span>
          </span>
        </Link>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
      {next ? (
        <Link
          to={`/tools/${next.id}`}
          className="group flex items-center justify-end gap-3 rounded-md border border-line bg-surface px-4 py-3 text-right transition-colors hover:border-line-strong"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[11px] text-faint">Next</span>
            <span className="block truncate text-sm font-medium text-fg">{next.name}</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}

export function ToolPage() {
  const { toolId = '' } = useParams();
  const tool = getTool(toolId);
  const seo = useMemo(() => seoForPath(`/tools/${toolId}`), [toolId]);

  useEffect(() => {
    if (tool && tool.status === 'ready') pushRecent(tool.id);
  }, [tool]);

  if (!tool) return <NotFoundPage />;

  const Icon = tool.icon;
  const isReady = tool.status === 'ready';
  const ToolComponent = tool.component;
  const groupLabel = getGroup(tool.group)?.label;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Seo data={seo} />
      <nav aria-label="Breadcrumb" className="font-mono text-[12px] text-faint">
        <Link to="/" className="transition-colors hover:text-fg">
          localcraft
        </Link>
        <span className="px-1.5">/</span>
        <Link
          to={`/${tool.category}`}
          className={cn('transition-colors hover:text-fg', tool.category === 'developer' ? 'text-ink' : 'text-pencil')}
        >
          {CATEGORIES[tool.category].label}
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-muted">{tool.name}</span>
      </nav>

      <header className="mt-5 flex flex-wrap items-start gap-4 border-b border-line pb-7">
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-md border shadow-[var(--shadow-sm)]',
            tool.category === 'developer'
              ? 'border-ink/20 bg-ink-tint text-ink'
              : 'border-pencil/20 bg-pencil-soft text-pencil',
          )}
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[26px] font-semibold tracking-tight text-fg">{tool.name}</h1>
            {isReady ? (
              <Badge tone={tool.category === 'developer' ? 'ink' : 'pencil'}>
                <span aria-hidden className="size-1.5 rounded-full bg-highlight" />
                ready
              </Badge>
            ) : (
              <Badge>planned</Badge>
            )}
            {groupLabel ? <Badge>{groupLabel}</Badge> : null}
          </div>
          <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-muted">{tool.blurb}</p>
          <p className="mt-2 font-mono text-[11px] text-faint">Runs offline · nothing is uploaded</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CopyLinkButton toolName={tool.name} />
          <StarButton tool={tool} className="border border-line bg-surface" />
        </div>
      </header>

      <div className="mt-9">
        {isReady && ToolComponent ? (
          <Suspense fallback={<ToolSkeleton />}>
            <ToolComponent />
          </Suspense>
        ) : (
          <PlannedPanel tool={tool} />
        )}
      </div>

      <RelatedTools toolId={tool.id} groupId={tool.group} />
      <PrevNext toolId={tool.id} category={tool.category} />
    </div>
  );
}
