import { For, Index, JSX, Match, Switch } from 'solid-js';
import { A } from '@solidjs/router';
import type { Coin } from '../lib/types';
import { compact, rangePosition } from '../lib/format';
import { Change, CoinIcon, Price, RangeMeter, Skeleton, WatchButton } from './ui';

interface CoinGridProps {
  coins: Coin[];
  loading: boolean;
  isWatched: (id: string) => boolean;
  onWatch: (id: string) => void;
  empty: JSX.Element;
}

function CoinCard(props: {
  coin: Coin;
  watched: boolean;
  onWatch: (id: string) => void;
}) {
  return (
    <div class="relative rounded-lg border border-line bg-panel p-4 transition-colors duration-150 hover:border-[#35383d]">
      <A
        href={`/coin/${props.coin.id}`}
        class="absolute inset-0 z-0 rounded-lg"
        aria-label={`Open ${props.coin.name}`}
      />

      <div class="pointer-events-none relative z-10">
        <div class="flex items-start gap-2.5">
          <CoinIcon symbol={props.coin.symbol} size="md" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium text-fg">{props.coin.name}</p>
            <p class="mt-0.5 font-mono text-[11px] text-dim">
              {props.coin.symbol}
              <span class="text-dim/70"> · #{props.coin.rank}</span>
            </p>
          </div>
        </div>

        <div class="mt-4 flex items-baseline justify-between gap-3">
          <Price value={props.coin.price} size="lg" />
          <Change value={props.coin.change} size="sm" flash />
        </div>

        <div class="mt-3">
          <RangeMeter
            position={rangePosition(props.coin.price, props.coin.low, props.coin.high)}
            low={props.coin.low}
            high={props.coin.high}
            labels
          />
        </div>

        <div class="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5 text-[11px] text-dim">
          <span>
            Vol <span class="font-mono tabular-nums text-muted">{compact(props.coin.quoteVolume)}</span>
          </span>
          <span class="font-mono tabular-nums text-dim">
            {compact(props.coin.trades)} trades
          </span>
        </div>
      </div>

      <WatchButton
        watched={props.watched}
        symbol={props.coin.symbol}
        onToggle={() => props.onWatch(props.coin.id)}
        class="absolute right-2 top-2 z-20"
      />
    </div>
  );
}

export function CoinGrid(props: CoinGridProps) {
  return (
    <Switch
      fallback={
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <For each={props.coins}>
            {(coin) => (
              <CoinCard
                coin={coin}
                watched={props.isWatched(coin.id)}
                onWatch={props.onWatch}
              />
            )}
          </For>
        </div>
      }
    >
      <Match when={props.loading}>
        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Index each={Array.from({ length: 6 })}>
            {() => (
              <div class="rounded-lg border border-line bg-panel p-4">
                <div class="flex items-center gap-2.5">
                  <Skeleton class="h-9 w-9" />
                  <div class="space-y-1.5">
                    <Skeleton class="h-3 w-24" />
                    <Skeleton class="h-2 w-10" />
                  </div>
                </div>
                <Skeleton class="mt-4 h-5 w-28" />
                <Skeleton class="mt-4 h-1 w-full" />
                <Skeleton class="mt-3 h-3 w-full" />
              </div>
            )}
          </Index>
        </div>
      </Match>

      <Match when={!props.coins.length}>
        <div class="rounded-lg border border-line bg-panel">{props.empty}</div>
      </Match>
    </Switch>
  );
}
