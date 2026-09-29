'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Group } from './types';

interface AppStateShape {
  group?: Group | null;
  displayName?: string;
  lastPlayerId?: string;
}

const KEY = 'studyjam.state';
const listeners = new Set<() => void>();

function load(): AppStateShape {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || '{}') || {};
  } catch {
    return {};
  }
}

let current: AppStateShape = load();

function save(next: AppStateShape) {
  current = next;
  if (typeof window !== 'undefined') sessionStorage.setItem(KEY, JSON.stringify(current));
  listeners.forEach((l) => l());
}

export const appState = {
  get<K extends keyof AppStateShape>(key: K): AppStateShape[K] {
    return current[key];
  },
  set<K extends keyof AppStateShape>(key: K, value: AppStateShape[K]) {
    save({ ...current, [key]: value });
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Reactive read of one app-state key, backed by sessionStorage (per-tab). */
export function useAppState<K extends keyof AppStateShape>(
  key: K
): [AppStateShape[K], (value: AppStateShape[K]) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => current[key],
    () => undefined as AppStateShape[K]
  );
  const setValue = useCallback((v: AppStateShape[K]) => appState.set(key, v), [key]);
  return [value, setValue];
}

/**
 * True once the client has mounted and sessionStorage-backed state (auth,
 * appState) reflects the real browser value rather than the SSR placeholder.
 * `useAppState`/`useAuth` can legitimately return `undefined`/`null` for a
 * key that's simply not set, so callers need this instead of an
 * undefined-check to distinguish "still loading" from "no value".
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function -- useSyncExternalStore requires a subscribe fn; this store never changes after hydration, so there's nothing to unsubscribe.
const noopSubscribe = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
