import { ArrowUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { CompassMark } from '@/components/CompassMark';
import { getTool, readyToolCount, toolRegistry } from '@/tools/registry';

const POPULAR_IDS = ['json-formatter', 'qr-tools', 'password-generator', 'pdf-merger', 'loan-calculator', 'regex-tester'];

export function Footer() {
  const navigate = useNavigate();
  const popular = POPULAR_IDS.map((id) => getTool(id)).filter((t): t is NonNullable<typeof t> => t !== undefined);

  const surprise = () => {
    const ready = toolRegistry.filter((tool) => tool.status === 'ready');
    const pick = ready[Math.floor(Math.random() * ready.length)];
    if (pick) navigate(`/tools/${pick.id}`);
  };

  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-fg">
            <CompassMark className="size-5 text-ink" />
            <span className="font-display text-[15px] font-semibold tracking-tight">LocalCraft</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            A workbench of small tools that run entirely in your tab. No servers to trust, no accounts,
            nothing to leak.
          </p>
          <p className="mt-3 font-mono text-[11px] text-faint">
            {readyToolCount} of {toolRegistry.length} tools ready · runs offline
          </p>
        </div>

        <nav aria-label="Explore">
          <h2 className="font-mono text-[11px] text-faint">Explore</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>
              <Link to="/" className="transition-colors hover:text-fg">
                All tools
              </Link>
            </li>
            <li>
              <Link to="/developer" className="transition-colors hover:text-fg">
                Developer tools
              </Link>
            </li>
            <li>
              <Link to="/everyday" className="transition-colors hover:text-fg">
                Everyday tools
              </Link>
            </li>
            <li>
              <button type="button" onClick={surprise} className="cursor-pointer transition-colors hover:text-fg">
                Surprise me
              </button>
            </li>
          </ul>
        </nav>

        <nav aria-label="Popular tools">
          <h2 className="font-mono text-[11px] text-faint">Popular</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {popular.map((tool) => (
              <li key={tool.id}>
                <Link to={`/tools/${tool.id}`} className="transition-colors hover:text-fg">
                  {tool.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-mono text-[11px] text-faint">Under the hood</h2>
          <ul className="mt-3 space-y-1.5 font-mono text-[12.5px] text-muted">
            <li>React + Vite, statically built</li>
            <li>Tailwind CSS, self-hosted fonts</li>
            <li>pdf-lib · pdf.js · Web Crypto</li>
            <li>Service Worker precache (PWA)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[11px] text-faint sm:px-6">
          <span>© 2026 LocalCraft contributors · MIT</span>
          <span className="hidden sm:inline">made for the tab you already have</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-faint transition-colors hover:border-line-strong hover:text-fg"
          >
            <ArrowUp className="size-3.5" aria-hidden />
            Top
          </button>
        </div>
      </div>
    </footer>
  );
}
