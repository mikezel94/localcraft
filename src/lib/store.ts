import { useEffect, useState, useSyncExternalStore } from 'react';

import { readJson, writeJson } from './storage';

interface Store<T> {
  get(): T;
  /** Stable snapshot for react-dom/server (prerendering). */
  getServer(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(listener: () => void): () => void;
}

/** Tiny persistent store — localStorage backing + useSyncExternalStore plumbing. */
function persistentStore<T>(key: string, fallback: T): Store<T> {
  const initial = readJson(key, fallback);
  let value = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());

  // Keep favorites/recents/theme in sync across tabs of the same local app.
  // (Guarded so the prerender build can import this module under Node.)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== key || event.newValue === null) return;
      try {
        value = JSON.parse(event.newValue) as T;
        emit();
      } catch {
        /* ignore malformed writes */
      }
    });
  }

  return {
    get: () => value,
    getServer: () => initial,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      writeJson(key, value);
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type ThemePreference = 'light' | 'dark' | 'system';

function readSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const themeStore = persistentStore<ThemePreference>('localcraft:theme', 'system');
const favoritesStore = persistentStore<string[]>('localcraft:favorites', []);
const recentsStore = persistentStore<string[]>('localcraft:recent', []);

function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer);
}

/** Stored preference: 'light' | 'dark' | 'system'. Previously stored 'light'/'dark' values keep working. */
export function useTheme(): ThemePreference {
  return useStore(themeStore);
}

export function useThemePreference(): ThemePreference {
  return useStore(themeStore);
}

/** Preference resolved to a concrete scheme (system → OS setting, live-updated). SSR-safe. */
export function useResolvedTheme(): 'light' | 'dark' {
  const preference = useStore(themeStore);
  const [system, setSystem] = useState<'light' | 'dark'>(readSystemTheme);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(query.matches ? 'dark' : 'light');
    onChange();
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }
    return;
  }, []);
  return preference === 'system' ? system : preference;
}

export function setTheme(theme: ThemePreference): void {
  themeStore.set(theme);
}

export function useFavorites(): string[] {
  return useStore(favoritesStore);
}

export function toggleFavorite(id: string): void {
  favoritesStore.set((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]));
}

export function clearFavorites(): void {
  favoritesStore.set([]);
}

export function useRecentTools(): string[] {
  return useStore(recentsStore);
}

export function pushRecent(id: string, cap = 8): void {
  recentsStore.set((ids) => [id, ...ids.filter((x) => x !== id)].slice(0, cap));
}

export function clearRecents(): void {
  recentsStore.set([]);
}
