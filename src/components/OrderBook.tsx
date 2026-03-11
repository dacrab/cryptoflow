import { Component, Show, For, createMemo } from 'solid-js';
import { getOrderBook } from '../api';
import { fmt } from '../utils';
import { Card, Skeleton, LiveDot } from './ui';
import { createPolled } from '../hooks';

const OrderRow: Component<{ item: [string, string]; maxQty: number; side: 'bid' | 'ask' }> = (props) => {
  const pct = () => (parseFloat(props.item[1]) / props.maxQty) * 100;
  const isBid = props.side === 'bid';
  return (
    <div class="relative flex items-center justify-between text-xs py-0.5 px-1 rounded">
      <div class={`absolute inset-0 rounded transition-all ${isBid ? 'bg-emerald-500/10' : 'bg-red-500/10'}`} style={{ width: `${pct()}%` }} />
      <span class={`relative font-mono ${isBid ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(parseFloat(props.item[0]))}</span>
      <span class="relative text-zinc-500 font-mono">{parseFloat(props.item[1]).toFixed(4)}</span>
    </div>
  );
};

const OrderBook: Component<{ coinId: string }> = (props) => {
  const { data, loading } = createPolled(() => getOrderBook(props.coinId, 8), 2000);

  const hasData = () => !!data()?.bids?.length && !!data()?.asks?.length;

  const maxQty = createMemo(() => {
    const d = data();
    if (!d) return 1;
    let max = 1;
    for (const [, q] of [...d.bids, ...d.asks]) { const n = parseFloat(q); if (n > max) max = n; }
    return max;
  });

  const buyPressure = createMemo(() => {
    const d = data();
    if (!d || d.bidTotal + d.askTotal === 0) return 50;
    return (d.bidTotal / (d.bidTotal + d.askTotal)) * 100;
  });

  return (
    <Card>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-zinc-300">Order Book</h3>
          <LiveDot show={hasData() && !loading()} />
        </div>
        <Show when={hasData()}>
          <span class="text-[10px] text-zinc-500">
            Spread: {fmt(data()!.spread)} ({data()!.spreadPercent.toFixed(3)}%)
          </span>
        </Show>
      </div>

      <Show when={loading() && !hasData()}>
        <div class="space-y-1">
          <For each={Array(8).fill(0)}>{() => <Skeleton class="h-5 rounded" />}</For>
        </div>
      </Show>

      <Show when={!loading() && !hasData()}>
        <div class="py-8 text-center text-zinc-500 text-sm">Order book unavailable</div>
      </Show>

      <Show when={hasData()}>
        <div class="space-y-0.5 mb-2">
          <For each={[...(data()!.asks)].reverse()}>
            {(item) => <OrderRow item={item} maxQty={maxQty()} side="ask" />}
          </For>
        </div>

        <div class="flex items-center justify-center gap-2 py-1.5 border-y border-zinc-800/50 my-2">
          <span class="text-xs font-mono text-red-400">{fmt(parseFloat(data()!.asks[0][0]))}</span>
          <span class="text-[10px] text-zinc-600">↕</span>
          <span class="text-xs font-mono text-emerald-400">{fmt(parseFloat(data()!.bids[0][0]))}</span>
        </div>

        <div class="space-y-0.5 mt-2">
          <For each={data()!.bids}>
            {(item) => <OrderRow item={item} maxQty={maxQty()} side="bid" />}
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
