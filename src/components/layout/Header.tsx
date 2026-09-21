import { Monitor, Moon, Search, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { Link, NavLink } from 'react-router';

import { CompassMark } from '@/components/CompassMark';
import { useCommandPalette } from '@/components/palette/CommandPalette';
import { Kbd } from '@/components/ui/misc';
import { setTheme, useThemePreference, type ThemePreference } from '@/lib/store';
import { useOnlineStatus } from '@/lib/useOnline';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/developer', label: 'Developer' },
  { to: '/everyday', label: 'Everyday' },
];

const THEME_ORDER: ThemePreference[] = ['light', 'dark', 'system'];

function nextTheme(current: ThemePreference): ThemePreference {
  return THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length]!;
}

export function Header() {
  const { setOpen } = useCommandPalette();
  const preference = useThemePreference();
  const online = useOnlineStatus();
  const shortcut = useMemo(
    () => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'),
    [],
  );

  const ThemeIcon = preference === 'light' ? Sun : preference === 'dark' ? Moon : Monitor;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 rounded-md text-fg" aria-label="LocalCraft home">
          <CompassMark className="size-6 text-ink" />
          <span className="font-display text-[17px] font-semibold tracking-tight">LocalCraft</span>
        </Link>

        <nav aria-label="Categories" className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  isActive ? 'bg-raised font-medium text-fg' : 'text-muted hover:bg-raised/60 hover:text-fg',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Compact category links for small screens */}
        <nav aria-label="Categories (compact)" className="ml-1 flex items-center gap-1 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-2 py-1.5 text-[13px] transition-colors',
                  isActive ? 'bg-raised font-medium text-fg' : 'text-muted hover:text-fg',
                )
              }
            >
              {item.label === 'Developer' ? 'Dev' : 'Life'}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {!online ? (
          <span
            role="status"
            title="You are offline — every tool keeps working"
            className="hidden items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 font-mono text-[11px] text-muted sm:inline-flex"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-pencil" />
            offline · still works
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Search tools"
          className="flex h-9 w-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-line bg-surface px-0 text-sm text-faint transition-colors hover:border-line-strong hover:text-muted sm:w-52 sm:px-3 md:w-72 [&>:first-child]:shrink-0"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="hidden truncate sm:inline">Search tools…</span>
          <Kbd className="ml-auto hidden shrink-0 md:inline-flex">{shortcut}</Kbd>
        </button>

        <button
          type="button"
          onClick={() => setTheme(nextTheme(preference))}
          aria-label={`Theme: ${preference}. Activate to switch to ${nextTheme(preference)} mode.`}
          title={`Theme: ${preference}`}
          className="flex size-9 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-fg"
        >
          <ThemeIcon className="size-4.5" aria-hidden />
        </button>
      </div>
    </header>
  );
}
