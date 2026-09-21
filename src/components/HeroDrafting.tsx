/**
 * Hero illustration: a compass mid-drawing, annotated like a technical figure.
 * Strokes draw themselves in on page load — the app's one orchestrated moment.
 */
export function HeroDrafting({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 264" fill="none" width={300} className={className} aria-hidden>
      <g stroke="var(--ink)" strokeLinecap="round">
        <path d="M160 34v14" strokeWidth="5" className="draw-in" />
        <circle cx="160" cy="60" r="9" strokeWidth="4" className="draw-in" style={{ animationDelay: '80ms' }} />
        <path d="M160 69 106 184" strokeWidth="3.5" className="draw-in" style={{ animationDelay: '180ms' }} />
        <path d="M160 69 214 184" strokeWidth="3.5" className="draw-in" style={{ animationDelay: '260ms' }} />
        <circle cx="160" cy="60" r="2.5" fill="var(--ink)" stroke="none" />
      </g>
      <path
        d="M92 178q68 64 136 0"
        stroke="var(--ink)"
        strokeWidth="2"
        opacity="0.55"
        className="draw-in"
        style={{ animationDelay: '420ms' }}
      />
      <g stroke="var(--muted)" strokeWidth="1.5" className="draw-in" style={{ animationDelay: '560ms' }}>
        <path d="M92 226h136" />
        <path d="M92 220v12M228 220v12" />
      </g>
      <text x="160" y="218" textAnchor="middle" fill="var(--muted)" fontSize="12" style={{ fontFamily: 'var(--font-mono)' }}>
        100% local
      </text>
      <text x="160" y="252" textAnchor="middle" fill="var(--faint)" fontSize="10.5" style={{ fontFamily: 'var(--font-mono)' }}>
        fig. 1 — your data, staying put
      </text>
    </svg>
  );
}
