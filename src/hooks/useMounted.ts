import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** False during SSR/hydration, true afterwards — without a setState-in-effect. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
