import { createResource, createSignal, onCleanup, onMount } from 'solid-js';

/** A ticking clock signal. Only the component that reads it re-renders. */
export function createNow(interval = 1000) {
  const [now, setNow] = createSignal(Date.now());

  onMount(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    onCleanup(() => window.clearInterval(timer));
  });

  return now;
}

/**
 * Resource polling that pauses while the tab is hidden and keeps the previous
 * value visible during a refresh. The source is reactive, so changing the
 * selected market refetches immediately instead of waiting for the next tick.
 */
export function createPolled<T, K>(
  source: () => K,
  fetcher: (key: K) => Promise<T>,
  interval: number,
) {
  const [tick, setTick] = createSignal(0);
  const [data] = createResource(
    () => ({ key: source(), tick: tick() }),
    async ({ key }) => ({ key, value: await fetcher(key) }),
  );

  const current = () => {
    const entry = data.latest;
    return entry && entry.key === source() ? entry.value : undefined;
  };

  const refresh = () => setTick((value) => value + 1);

  onMount(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, interval);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    onCleanup(() => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  });

  return { data, current, refresh };
}
