import { Component, Index, Match, Show, Switch, createMemo } from 'solid-js';
import { fetchDepth } from '../lib/api';
import { createPolled } from '../lib/hooks';
import { price as formatPrice, qty as formatQty } from '../lib/format';
import { Panel, RetryState, Skeleton, StatusPill } from './ui';
import type { Level } from '../lib/types';

function DepthRow(props: { level: Level; side: 'bid' | 'ask'; max: number }) {
  const width = () => Math.min(100, (props.level.total / props.max) * 100);

  return (
    <div class="relative grid grid-cols-[1.2fr_1fr_1fr] items-center py-[3px] font-mono text-[10px] tabular-nums">
      <div
        classList={{
          'absolute inset-y-0 right-0 bg-up/[0.07]': props.side === 'bid',
          'absolute inset-y-0 right-0 bg-down/[0.07]': props.side === 'ask',
        }}
        style={{ width: `${width()}%` }}
      />
      <span class={`relative ${props.side === 'bid' ? 'text-up' : 'text-down'}`}>
        {formatPrice(props.level.price)}
      </span>
      <span class="relative text-right text-muted">{formatQty(props.level.qty)}</span>
      <span class="relative text-right text-dim">{formatQty(props.level.total)}</span>
    </div>
  );
}

export const OrderBook: Component<{ symbol: string }> = (props) => {
  const { data, current, refresh } = createPolled(
    () => props.symbol,
    (symbol) => fetchDepth(symbol, 10),
    2500,
  );
  const book = () => (data.error ? undefined : current());

  const maxTotal = createMemo(() => {
    const depth = book();
    if (!depth) return 1;
    return Math.max(depth.bidTotal, depth.askTotal, 1);
  });

  const pressure = createMemo(() => {
    const depth = book();
    if (!depth || depth.bidTotal + depth.askTotal === 0) return 50;
    return (depth.bidTotal / (depth.bidTotal + depth.askTotal)) * 100;
  });

  const mid = createMemo(() => {
    const depth = book();
    if (!depth || !depth.bids[0] || !depth.asks[0]) return 0;
    return (depth.bids[0].price + depth.asks[0].price) / 2;
  });

  return (
    <Panel flush class="overflow-hidden">
      <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div class="flex items-center gap-2">
          <h2 class="text-[13px] font-medium text-fg">Order book</h2>
          <StatusPill state={book() ? 'live' : 'connecting'} compact />
        </div>
        <Show when={book()}>
          {(depth) => (
            <span class="font-mono text-[10px] tabular-nums text-dim">
              {formatPrice(depth().spread)} · {depth().spreadPct.toFixed(3)}%
            </span>
          )}
        </Show>
      </div>

      <div class="px-4 pb-4 pt-3">
        <Switch
          fallback={
            <div class="space-y-1.5">
              <Index each={Array.from({ length: 10 })}>
                {() => (
                  <div class="grid grid-cols-3 gap-2">
                    <Skeleton class="h-3 w-16" />
                    <Skeleton class="ml-auto h-3 w-12" />
                    <Skeleton class="ml-auto h-3 w-12" />
                  </div>
                )}
              </Index>
            </div>
          }
        >
          <Match when={data.error}>
            <RetryState message="Order book unavailable." onRetry={refresh} />
          </Match>

          <Match when={book()}>
            {(depth) => (
              <>
                <div class="mb-1 grid grid-cols-[1.2fr_1fr_1fr] border-b border-line pb-1.5 text-[10px] text-dim">
                  <span>Price</span>
                  <span class="text-right">Amount</span>
                  <span class="text-right">Total</span>
                </div>

                <Index each={[...depth().asks].slice().reverse()}>
                  {(level) => <DepthRow level={level()} side="ask" max={maxTotal()} />}
                </Index>

                <div class="my-2 flex items-center justify-between border-y border-line py-1.5 font-mono text-[10px] tabular-nums">
                  <span class="text-dim">Mid</span>
                  <span class="text-fg">{formatPrice(mid())}</span>
                  <span class="text-dim">{pressure() >= 50 ? 'bid heavy' : 'ask heavy'}</span>
                </div>

                <Index each={depth().bids}>
                  {(level) => <DepthRow level={level()} side="bid" max={maxTotal()} />}
                </Index>

                <div class="mt-4 border-t border-line pt-3">
                  <div class="mb-1.5 flex items-center justify-between font-mono text-[10px] tabular-nums">
                    <span class="text-up">Bids {pressure().toFixed(1)}%</span>
                    <span class="text-down">Asks {(100 - pressure()).toFixed(1)}%</span>
                  </div>
                  <div class="flex h-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      class="h-full bg-up/70 transition-[width] duration-500"
                      style={{ width: `${pressure()}%` }}
                    />
                    <div
                      class="h-full bg-down/60 transition-[width] duration-500"
                      style={{ width: `${100 - pressure()}%` }}
                    />
                  </div>
                </div>
              </>
            )}
          </Match>
        </Switch>
      </div>
    </Panel>
  );
};
