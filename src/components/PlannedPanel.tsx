import { Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import type { ToolDefinition } from '@/tools/types';

/** Shown for registry entries that are on the roadmap but not built yet. */
export function PlannedPanel({ tool }: { tool: ToolDefinition }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl rounded-md border border-dashed border-line-strong bg-raised/40 p-6">
      <p className="flex items-center gap-2 font-mono text-[12px] text-faint">
        <Compass className="size-4" aria-hidden />
        on the workbench
      </p>
      <p className="mt-3 leading-relaxed text-muted">
        “{tool.name}” is on the roadmap but hasn’t been built yet. Everything in LocalCraft ships the same
        way, though: fully client-side, no uploads, no accounts.
      </p>
      <p className="mt-2 text-sm text-faint">
        The registry makes new tools a single folder plus one entry — see “Add a tool” in the README to
        build this one.
      </p>
      <Button className="mt-5" onClick={() => navigate(-1)}>
        Go back
      </Button>
      <Link
        to="/"
        className="ml-2 inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-fg"
      >
        All tools
      </Link>
    </div>
  );
}
