import { Component, Show, For, createSignal, createEffect, onCleanup } from 'solid-js';
import { getOrderBook, type OrderBookData } from '../api';
import { fmt } from '../utils';
import { Card, Skeleton, LiveDot, SKELETON_ROWS_8 } from './ui';

interface Props {
  coinId: string;
}

const OrderBook: Component<Props> = (props) => {
  const [data, setData] = createSignal<OrderBookData | null>(null);
  const [loading, setLoading] = createSignal(true);

  const fetchData = async () => {
    try {
      const result = await getOrderBook(props.coinId, 8);
      if (result?.bids?.length && result?.asks?.length) setData(result);
    } catch {} finally { setLoading(false); }
  };

  createEffect(() => {
    if (!props.coinId) return;
    setLoading(true);
    setData(null);
    fetchData();
    const interval = setInterval(fetchData, 2000);
    onCleanup(() => clearInterval(interval));
  });

  const maxQty = () => {
    const d = data();
    if (!d?.bids || !d?.asks) return 1;
    return Math.max(...[...d.bids, ...d.asks].map(([, q]) => parseFloat(q || '0')), 1);
  };

  const buyPressure = () => {
    const d = data();
    if (!d || d.bidTotal + d.askTotal === 0) return 50;
    return (d.bidTotal / (d.bidTotal + d.askTotal)) * 100;
  };

  const bestAsk = () => parseFloat(data()?.asks?.[0]?.[0] || '0');
  const bestBid = () => parseFloat(data()?.bids?.[0]?.[0] || '0');
  const hasData = () => data()?.bids?.length && data()?.asks?.length;

  return (
    <Card>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-zinc-300">Order Book</h3>
          <LiveDot show={!!hasData() && !loading()} />
        </div>
        <Show when={hasData()}>
          <span class="text-[10px] text-zinc-500">
            Spread: {fmt(data()!.spread)} ({data()!.spreadPercent.toFixed(3)}%)
          </span>
        </Show>
      </div>

      <Show when={loading() && !hasData()}>
        <div class="space-y-1">
          <For each={SKELETON_ROWS_8}>{() => <Skeleton class="h-5 rounded" />}</For>
        </div>
      </Show>

      <Show when={!loading() && !hasData()}>
        <div class="py-8 text-center text-zinc-500 text-sm">Order book unavailable</div>
      </Show>

      <Show when={hasData()}>
        <div class="space-y-0.5 mb-2">
          <For each={[...(data()?.asks || [])].reverse()}>
            {(item) => {
              if (!item?.[0] || !item?.[1]) return null;
              const pct = (parseFloat(item[1]) / maxQty()) * 100;
              return (
                <div class="relative flex items-center justify-between text-xs py-0.5 px-1 rounded">
                  <div class="absolute inset-0 bg-red-500/10 rounded transition-all" style={{ width: `${pct}%` }} />
                  <span class="relative text-red-400 font-mono">{fmt(parseFloat(item[0]))}</span>
                  <span class="relative text-zinc-500 font-mono">{parseFloat(item[1]).toFixed(4)}</span>
                </div>
              );
            }}
          </For>
        </div>

        <div class="flex items-center justify-center gap-2 py-1.5 border-y border-zinc-800/50 my-2">
          <span class="text-xs font-mono text-red-400">{fmt(bestAsk())}</span>
          <span class="text-[10px] text-zinc-600">↕</span>
          <span class="text-xs font-mono text-emerald-400">{fmt(bestBid())}</span>
        </div>

        <div class="space-y-0.5 mt-2">
          <For each={data()?.bids || []}>
            {(item) => {
              if (!item?.[0] || !item?.[1]) return null;
              const pct = (parseFloat(item[1]) / maxQty()) * 100;
              return (
                <div class="relative flex items-center justify-between text-xs py-0.5 px-1 rounded">
                  <div class="absolute inset-0 bg-emerald-500/10 rounded transition-all" style={{ width: `${pct}%` }} />
                  <span class="relative text-emerald-400 font-mono">{fmt(parseFloat(item[0]))}</span>
                  <span class="relative text-zinc-500 font-mono">{parseFloat(item[1]).toFixed(4)}</span>
                </div>
              );
            }}
          </For>
        </div>

        <div class="mt-4 pt-3 border-t border-zinc-800/50">
          <div class="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
            <span>Buyers</span><span>Sellers</span>
          </div>
          <div class="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
            <div class="bg-emerald-500/70 h-full transition-all duration-500" style={{ width: `${buyPressure()}%` }} />
            <div class="bg-red-500/70 h-full transition-all duration-500" style={{ width: `${100 - buyPressure()}%` }} />
          </div>
          <div class="flex items-center justify-between text-[10px] mt-1">
            <span class="text-emerald-400 font-mono">{buyPressure().toFixed(1)}%</span>
            <span class="text-red-400 font-mono">{(100 - buyPressure()).toFixed(1)}%</span>
          </div>
        </div>
      </Show>
    </Card>
  );
};

export default OrderBook;
