import { useMemo, useState } from 'react';

import { TextInput } from '@/components/ui/inputs';
import { TitleBlock } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

interface StatusEntry {
  code: number;
  name: string;
  note: string;
}

const STATUSES: StatusEntry[] = [
  { code: 100, name: 'Continue', note: 'Client should continue with the request body.' },
  { code: 101, name: 'Switching Protocols', note: 'Server is switching protocols, e.g. to WebSocket.' },
  { code: 103, name: 'Early Hints', note: 'Preload hints while the final response is prepared.' },
  { code: 200, name: 'OK', note: 'The standard success response.' },
  { code: 201, name: 'Created', note: 'A new resource was created; usually from POST. Set Location header.' },
  { code: 202, name: 'Accepted', note: 'Queued for processing — common for async jobs.' },
  { code: 204, name: 'No Content', note: 'Success with an empty body — typical for DELETE or PUT.' },
  { code: 206, name: 'Partial Content', note: 'Range requests, e.g. video streaming or resume.' },
  { code: 301, name: 'Moved Permanently', note: 'Permanent redirect. Search engines transfer ranking.' },
  { code: 302, name: 'Found', note: 'Temporary redirect; method may change to GET.' },
  { code: 303, name: 'See Other', note: 'Fetch the new resource with GET — used after POST forms.' },
  { code: 304, name: 'Not Modified', note: 'Cache is still valid; client should use its copy.' },
  { code: 307, name: 'Temporary Redirect', note: 'Like 302 but keeps the request method.' },
  { code: 308, name: 'Permanent Redirect', note: 'Like 301 but keeps the request method.' },
  { code: 400, name: 'Bad Request', note: 'Malformed syntax or invalid input.' },
  { code: 401, name: 'Unauthorized', note: 'Authentication required or failed — send credentials.' },
  { code: 403, name: 'Forbidden', note: 'Authenticated but not allowed. Retrying will not help.' },
  { code: 404, name: 'Not Found', note: 'No resource at this URL.' },
  { code: 405, name: 'Method Not Allowed', note: 'The HTTP method is not supported here; check Allow header.' },
  { code: 409, name: 'Conflict', note: 'State conflict, e.g. duplicate or stale update.' },
  { code: 410, name: 'Gone', note: 'Deliberately removed — stronger than 404.' },
  { code: 412, name: 'Precondition Failed', note: 'An If-Match/If-Unmodified-Since header did not hold.' },
  { code: 415, name: 'Unsupported Media Type', note: 'The payload format is not accepted.' },
  { code: 418, name: "I'm a teapot", note: 'RFC 2324 joke status, honored sincerely worldwide.' },
  { code: 422, name: 'Unprocessable Content', note: 'Syntactically valid but semantically wrong — validation errors.' },
  { code: 425, name: 'Too Early', note: 'Server is unwilling to risk processing a replayed request.' },
  { code: 428, name: 'Precondition Required', note: 'Server demands conditional requests to avoid lost updates.' },
  { code: 429, name: 'Too Many Requests', note: 'Rate limited — back off; check Retry-After.' },
  { code: 431, name: 'Request Header Fields Too Large', note: 'Headers exceed server limits — often oversized cookies.' },
  { code: 451, name: 'Unavailable For Legal Reasons', note: 'Blocked by a legal demand.' },
  { code: 500, name: 'Internal Server Error', note: 'Unhandled server failure. Check the logs, not the request.' },
  { code: 501, name: 'Not Implemented', note: 'Server does not support this functionality.' },
  { code: 502, name: 'Bad Gateway', note: 'Upstream returned an invalid response.' },
  { code: 503, name: 'Service Unavailable', note: 'Overloaded or down for maintenance; often temporary.' },
  { code: 504, name: 'Gateway Timeout', note: 'Upstream did not answer in time.' },
  { code: 507, name: 'Insufficient Storage', note: 'Server is out of space to complete the request.' },
];

const CATEGORIES = [
  { prefix: 1, label: '1xx informational' },
  { prefix: 2, label: '2xx success' },
  { prefix: 3, label: '3xx redirection' },
  { prefix: 4, label: '4xx client error' },
  { prefix: 5, label: '5xx server error' },
];

export default function HttpStatusLookup() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STATUSES.filter((status) => {
      if (category !== null && Math.floor(status.code / 100) !== category) return false;
      if (!q) return true;
      return String(status.code).includes(q) || status.name.toLowerCase().includes(q) || status.note.toLowerCase().includes(q);
    });
  }, [query, category]);

  return (
    <div className="max-w-4xl space-y-6">
      <TitleBlock title="Status codes" />
      <TextInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by code, name or meaning — try “404” or “redirect”…"
        aria-label="Search status codes"
        className="max-w-md"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          aria-pressed={category === null}
          className={cn(
            'cursor-pointer rounded-md border px-3 py-1.5 text-[13px] transition-colors',
            category === null ? 'border-ink/30 bg-ink-tint text-ink' : 'border-line bg-surface text-muted hover:text-fg',
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.prefix}
            type="button"
            onClick={() => setCategory(cat.prefix)}
            aria-pressed={category === cat.prefix}
            className={cn(
              'cursor-pointer rounded-md border px-3 py-1.5 text-[13px] transition-colors',
              category === cat.prefix ? 'border-ink/30 bg-ink-tint text-ink' : 'border-line bg-surface text-muted hover:text-fg',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <p aria-live="polite" className="font-mono text-[11px] text-faint">
        {filtered.length} of {STATUSES.length} codes{query.trim() ? ` match “${query.trim()}”` : ''}
      </p>

      <ul className="grid gap-2 sm:grid-cols-2">
        {filtered.map((status) => (
          <li key={status.code} className="rounded-md border border-line bg-surface p-4">
            <p className="flex items-baseline gap-3">
              <span className="font-mono text-[18px] font-semibold text-fg">{status.code}</span>
              <span className="font-medium text-fg">{status.name}</span>
            </p>
            <p className="mt-1 text-[13px] leading-snug text-muted">{status.note}</p>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="col-span-full rounded-md border border-dashed border-line-strong bg-raised/40 px-4 py-10 text-center text-sm text-faint">
            No status code matches “{query}”.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
