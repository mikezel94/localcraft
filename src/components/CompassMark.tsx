/** The LocalCraft mark: a drafting compass. `currentColor` strokes. */
export function CompassMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="32" cy="19" r="4" strokeWidth="4" />
      <path d="M32 23 22.5 48" strokeWidth="4" />
      <path d="M32 23 41.5 48" strokeWidth="4" />
      <path d="M32 9v5" strokeWidth="4.5" />
      <path d="M19.5 45q12.5 12 25 0" strokeWidth="3" />
    </svg>
  );
}
