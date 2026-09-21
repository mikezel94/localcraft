import { useEffect, useRef, useState } from 'react';

interface DebouncedBytesState {
  bytes: Uint8Array | null;
  error: string | null;
}

/**
 * Rebuilds generated content (e.g. PDF bytes) after `deps` settle, debounced,
 * and reports build errors. Keeps document generation off the keystroke path.
 */
export function useDebouncedBytes(
  build: () => Promise<Uint8Array>,
  deps: unknown[],
  delay = 250,
): DebouncedBytesState {
  const [state, setState] = useState<DebouncedBytesState>({ bytes: null, error: null });
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      buildRef.current()
        .then((bytes) => {
          if (!cancelled) setState({ bytes, error: null });
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setState({ bytes: null, error: error instanceof Error ? error.message : String(error) });
          }
        });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // deps are supplied by the caller (usually a serialized spec)
  }, [delay, ...deps]);

  return state;
}
