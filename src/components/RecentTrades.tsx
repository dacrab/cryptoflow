import { Component, Index, Match, Switch, createMemo } from 'solid-js';
import { fetchTrades } from '../lib/api';
import { createPolled } from '../lib/hooks';
import { compact, price as formatPrice, qty as formatQty, time } from '../lib/format';
import { Panel, RetryState, Skeleton, StatusPill } from './ui';

export const RecentTrades: Component<{ symbol: string }> = (props) => {
  const { data, current, refresh } = createPolled(
    () => props.symbol,
    (symbol) => fetchTrades(symbol, 18),
    1600,
  );
  const trades = () => (data.error ? undefined : current());

  const summary = createMemo(() => {
    const list = trades();
    if (!list?.length) return { buys: 0, sells: 0, buyVolume: 0, sellVolume: 0 };

    let buys = 0;
    let sells = 0;
    let buyVolume = 0;
    let sellVolume = 0;

    for (const trade of list) {
      if (trade.side === 'buy') {
        buys += 1;
        buyVolume += trade.quote;
      } else {
        sells += 1;
        sellVolume += trade.quote;
      }
    }

    return { buys, sells, buyVolume, sellVolume };
  });

  return (
    <Panel flush class="overflow-hidden">
      <div class="flex items-center justify-between border-b border-line px-4 py-2.5">
        <div class="flex items-center gap-2">
          <h2 class="text-[13px] font-medium text-fg">Recent trades</h2>
          <StatusPill state={trades() ? 'live' : 'connecting'} compact />
        </div>
        <span class="font-mono text-[10px] text-dim">{trades()?.length ?? 0} fills</span>
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
                    <Skeleton class="ml-auto h-3 w-10" />
                  </div>
                )}
              </Index>
            </div>
          }
        >
          <Match when={data.error}>
            <RetryState message="Trade feed unavailable." onRetry={refresh} />
          </Match>

          <Match when={trades()}>
            {(list) => (
              <>
                <div class="mb-1 grid grid-cols-[1.2fr_1fr_auto] gap-2 border-b border-line pb-1.5 pr-1 text-[10px] text-dim">
                  <span>Price</span>
                  <span class="text-right">Amount</span>
                  <span class="w-14 text-right">UTC</span>
                </div>

                <div class="max-h-[286px] overflow-y-auto pr-1 no-scrollbar">
                  <Index each={list()}>
                    {(trade) => (
                      <div class="grid grid-cols-[1.2fr_1fr_auto] items-center gap-2 py-[3px] font-mono text-[10px] tabular-nums">
                        <span class={trade().side === 'buy' ? 'text-up' : 'text-down'}>
                          {formatPrice(trade().price)}
                        </span>
                        <span class="text-right text-muted">{formatQty(trade().qty)}</span>
                        <span class="w-14 text-right text-dim">{time(trade().time)}</span>
                      </div>
                    )}
                  </Index>
                </div>

                <div class="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
                  <div>
                    <p class="text-[10px] text-dim">
                      Buys <span class="text-up">{summary().buys}</span>
                    </p>
                    <p class="mt-0.5 font-mono text-[11px] text-up">
                      ${compact(summary().buyVolume)}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] text-dim">
                      Sells <span class="text-down">{summary().sells}</span>
                    </p>
                    <p class="mt-0.5 font-mono text-[11px] text-down">
                      ${compact(summary().sellVolume)}
                    </p>
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
