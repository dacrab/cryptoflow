import { Index, Match, Show, Switch, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { useMarket } from '../lib/market';
import { pct, usdCompact } from '../lib/format';
import { Button, Empty, Panel, Skeleton } from '../components/ui';
import { CoinGrid } from '../components/CoinGrid';

export default function Watchlist() {
  const market = useMarket();

  const coins = market.watchlistCoins;

  const summary = createMemo(() => {
    const list = coins();
    if (!list.length) return null;

    let volume = 0;
    let changeSum = 0;
    let best = list[0];
    let worst = list[0];

    for (const coin of list) {
      volume += coin.quoteVolume;
      changeSum += coin.change;
      if (coin.change > best.change) best = coin;
      if (coin.change < worst.change) worst = coin;
    }

    return {
      count: list.length,
      average: changeSum / list.length,
      volume,
      best,
      worst,
    };
  });

  return (
    <div class="space-y-5">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-[20px] font-semibold tracking-tight text-fg">Watchlist</h1>
          <Show
            when={summary()}
            fallback={
              <p class="mt-1 text-[13px] text-muted">
                Saved in this browser. Star a market to follow it.
              </p>
            }
          >
            {(data) => (
              <p class="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-[11px] tabular-nums text-dim">
                <span>{data().count} markets</span>
                <span>·</span>
                <span class={data().average >= 0 ? 'text-up' : 'text-down'}>
                  avg {pct(data().average)}
                </span>
                <span>·</span>
                <span>{usdCompact(data().volume)} 24h volume</span>
                <span class="hidden sm:inline">·</span>
                <span class="hidden sm:inline">
                  best {data().best.symbol} <span class="text-up">{pct(data().best.change)}</span>
                </span>
                <span class="hidden sm:inline">
                  worst {data().worst.symbol}{' '}
                  <span class="text-down">{pct(data().worst.change)}</span>
                </span>
              </p>
            )}
          </Show>
        </div>

        <div class="flex items-center gap-2">
          <A href="/">
            <Button variant="secondary" size="sm">
              Browse markets
            </Button>
          </A>
          <Show when={market.watchlist().length}>
            <Button variant="ghost" size="sm" onClick={market.clearWatchlist}>
              Clear
            </Button>
          </Show>
        </div>
      </header>

      <Switch
        fallback={
          <>
            <CoinGrid
              coins={coins()}
              loading={false}
              isWatched={market.isWatched}
              onWatch={market.toggleWatch}
              empty={<></>}
            />

            <p class="pt-1 text-[11px] text-dim">
              Watchlist stored in this browser. Everything else comes from Binance.
            </p>
          </>
        }
      >
        <Match when={market.error() && !market.coins().length}>
          <Panel flush>
            <Empty
              icon="alert"
              iconClass="text-down"
              title="Market data unavailable"
              body={market.error()?.message}
              action={
                <Button variant="secondary" size="sm" onClick={market.refresh}>
                  Try again
                </Button>
              }
            />
          </Panel>
        </Match>

        <Match when={!market.ready()}>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Index each={Array.from({ length: 3 })}>
              {() => <Skeleton class="h-44 rounded-lg" />}
            </Index>
          </div>
        </Match>

        <Match when={!coins().length}>
          <Panel flush>
            <Empty
              icon="star"
              title="Nothing saved yet"
              body="Star a market from the table or an asset page and it will appear here."
              action={
                <A href="/">
                  <Button variant="secondary" size="sm">
                    Browse markets
                  </Button>
                </A>
              }
            />
          </Panel>
        </Match>
      </Switch>
    </div>
  );
}
