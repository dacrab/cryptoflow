import { Component, createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { getRecentTrades, type Trade } from '../api';
import { fmt } from '../utils';
import { Card, Skeleton, LiveDot, SKELETON_ROWS_10 } from './ui';

interface Props {
  coinId: string;
}

const RecentTrades: Component<Props> = (props) => {
  const [trades, setTrades] = createSignal<Trade[]>([]);
  const [loading, setLoading] = createSignal(true);

  const fetchData = async () => {
    try {
      const result = await getRecentTrades(props.coinId, 15);
      if (result?.length) setTrades(result);
    } catch {} finally { setLoading(false); }
  };

  createEffect(() => {
    if (!props.coinId) return;
    setLoading(true);
    setTrades([]);
    fetchData();
    const interval = setInterval(fetchData, 1500);
    onCleanup(() => clearInterval(interval));
  });

  const formatTime = (ts: number) => {
    if (!ts) return '--:--:--';
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatQty = (qty: number) => {
    if (!qty || isNaN(qty)) return '0';
    return qty >= 1 ? qty.toFixed(4) : qty >= 0.01 ? qty.toFixed(6) : qty.toFixed(8);
  };

  const summary = () => {
    const t = trades();
    if (!t?.length) return { buyCount: 0, sellCount: 0, buyVol: 0, sellVol: 0 };
    const buys = t.filter(tr => tr?.isBuy);
    const sells = t.filter(tr => tr && !tr.isBuy);
    return {
      buyCount: buys.length,
      sellCount: sells.length,
      buyVol: buys.reduce((s, tr) => s + (tr?.quoteQty || 0), 0),
      sellVol: sells.reduce((s, tr) => s + (tr?.quoteQty || 0), 0),
    };
  };

  const hasData = () => trades()?.length > 0;

  return (
    <Card>
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-medium text-zinc-300">Recent Trades</h3>
          <LiveDot show={hasData() && !loading()} />
        </div>
        <span class="text-[10px] text-zinc-500">Live</span>
      </div>

      <div class="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] text-zinc-600 uppercase pb-2 border-b border-zinc-800/50">
        <span>Price</span>
        <span class="text-right">Amount</span>
        <span class="text-right w-16">Time</span>
      </div>

      <Show when={loading() && !hasData()}>
        <div class="space-y-1 mt-2">
          <For each={SKELETON_ROWS_10}>{() => <Skeleton class="h-5 rounded" />}</For>
        </div>
      </Show>

      <Show when={!loading() && !hasData()}>
        <div class="py-8 text-center text-zinc-500 text-sm">Trades unavailable</div>
      </Show>

      <Show when={hasData()}>
        <div class="divide-y divide-zinc-800/30 max-h-72 overflow-y-auto">
          <For each={trades()}>
            {(trade, i) => {
              if (!trade) return null;
              return (
                <div class={`grid grid-cols-[1fr_1fr_auto] gap-2 py-1.5 text-xs transition-colors ${i() === 0 ? 'bg-white/[0.02]' : ''}`}>
                  <span class={`font-mono ${trade.isBuy ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(trade.price || 0)}</span>
                  <span class="font-mono text-zinc-400 text-right">{formatQty(trade.qty)}</span>
                  <span class="font-mono text-zinc-600 text-right w-16">{formatTime(trade.time)}</span>
                </div>
              );
            }}
          </For>
        </div>

        <div class="mt-3 pt-3 border-t border-zinc-800/50 grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <div class="text-zinc-500 mb-0.5">Buys ({summary().buyCount})</div>
            <div class="text-emerald-400 font-mono">{fmt(summary().buyVol)}</div>
          </div>
          <div class="text-right">
            <div class="text-zinc-500 mb-0.5">Sells ({summary().sellCount})</div>
            <div class="text-red-400 font-mono">{fmt(summary().sellVol)}</div>
          </div>
        </div>
      </Show>
    </Card>
  );
};

export default RecentTrades;
