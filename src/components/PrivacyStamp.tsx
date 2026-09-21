import { Lock } from 'lucide-react';

import { cn } from '@/lib/utils';

/** The privacy promise, rendered as an inspection stamp. */
export function PrivacyStamp({ className }: { className?: string }) {
  return (
    <div className={cn('stamp inline-flex w-fit items-center gap-2.5 px-4 py-2.5 text-ink', className)} role="note">
      <Lock className="size-4 shrink-0" aria-hidden />
      <span className="font-mono text-[12.5px] font-medium tracking-wide">
        100% client-side — your data never leaves your browser
      </span>
    </div>
  );
}
