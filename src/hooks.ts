import { createSignal, createEffect, onCleanup } from 'solid-js';

// fetcher must be a reactive closure — any signal reads inside it
// are tracked, so the effect re-runs when they change (e.g. props.coinId).
export function createPolled<T>(
  fetcher: () => Promise<T | null>,
  interval: number,
) {
  const [data, setData] = createSignal<T | null>(null);
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);

    const run = async () => {
      try {
        const result = await fetcher(); // reactive: tracked signal reads here
        if (!cancelled && result !== null) setData(() => result);
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    const id = setInterval(run, interval);
    onCleanup(() => { cancelled = true; clearInterval(id); });
  });

  return { data, loading };
}
