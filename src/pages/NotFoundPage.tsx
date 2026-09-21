import { useMemo } from 'react';
import { FileQuestion } from 'lucide-react';
import { Link } from 'react-router';

import { Seo } from '@/components/Seo';
import { useCommandPalette } from '@/components/palette/CommandPalette';
import { Button } from '@/components/ui/button';
import { seoForPath } from '@/lib/seoData';
import { useLocation } from 'react-router';

export function NotFoundPage() {
  const { setOpen } = useCommandPalette();
  const { pathname } = useLocation();
  const seo = useMemo(() => seoForPath(pathname), [pathname]);
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-start px-4 py-24 sm:px-6">
      <Seo data={seo} />
      <FileQuestion className="size-7 text-faint" aria-hidden />
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight text-fg">
        Nothing at this address.
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-muted">
        The page you asked for doesn’t exist. Everything that does exist is one ⌘K away.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Search tools
        </Button>
        <Link
          to="/"
          className="inline-flex items-center rounded-md border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-fg transition-colors hover:border-faint"
        >
          Back to the dashboard
        </Link>
      </div>
      <p className="mt-6 font-mono text-[12px] text-faint">
        Popular:{' '}
        <Link to="/tools/json-formatter" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
          JSON formatter
        </Link>{' '}
        ·{' '}
        <Link to="/tools/qr-tools" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
          QR codes
        </Link>{' '}
        ·{' '}
        <Link to="/tools/password-generator" className="underline decoration-line-strong underline-offset-2 hover:text-fg">
          Passwords
        </Link>
      </p>
    </div>
  );
}
