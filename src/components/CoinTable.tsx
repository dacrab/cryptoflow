import { For, Index, JSX, Show } from 'solid-js';
import { A } from '@solidjs/router';
import type { Coin, Direction, SortKey } from '../lib/types';
import { compact, price as formatPrice, rangePosition } from '../lib/format';
import { Change, CoinIcon, Price, RangeMeter, Skeleton, WatchButton } from './ui';
import { Icon } from './Icon';

interface CoinTableProps {
  coins: Coin[];
  loading: boolean;
  sort: SortKey;
  direction: Direction;
  onSort: (field: SortKey) => void;
  isWatched: (id: string) => boolean;
  onWatch: (id: string) => void;
  empty: JSX.Element;
}

function SortHeader(props: {
  label: string;
  field: SortKey;
  sort: SortKey;
  direction: Direction;
  onSort: (field: SortKey) => void;
  align?: 'left' | 'right';
  class?: string;
}) {
  const active = () => props.sort === props.field;

  return (
    <th
      scope="col"
      aria-sort={active() ? (props.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      class={`px-3 py-2 ${props.align === 'right' ? 'text-right' : 'text-left'} ${props.class ?? ''}`}
    >
      <button
        type="button"
        onClick={() => props.onSort(props.field)}
        classList={{
          'text-fg': active(),
          'text-dim hover:text-muted': !active(),
        }}
        class="inline-flex items-center gap-1 text-[11px] font-medium transition-colors"
      >
        {props.label}
        <Show when={active()}>
          <Icon name={props.direction === 'asc' ? 'arrowUp' : 'arrowDown'} size={9} />
        </Show>
      </button>
    </th>
  );
}

export function CoinTable(props: CoinTableProps) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full table-fixed border-collapse sm:table-auto">
        <thead>
          <tr class="border-b border-line">
            <th scope="col" class="hidden w-10 px-3 py-2 text-right sm:table-cell">
              <span class="text-[11px] font-medium text-dim">#</span>
            </th>
            <SortHeader
              label="Asset"
              field="name"
              sort={props.sort}
              direction={props.direction}
              onSort={props.onSort}
            />
            <th
              scope="col"
              class="hidden px-3 py-2 text-left text-[11px] font-medium text-dim xl:table-cell"
            >
              24h range
            </th>
            <SortHeader
              label="Price"
              field="price"
              sort={props.sort}
              direction={props.direction}
              onSort={props.onSort}
              align="right"
              class="hidden sm:table-cell"
            />
            <SortHeader
              label="24h"
              field="change"
              sort={props.sort}
              direction={props.direction}
              onSort={props.onSort}
              align="right"
              class="max-sm:w-[84px] max-sm:px-2"
            />
            <SortHeader
              label="Volume"
              field="volume"
              sort={props.sort}
              direction={props.direction}
              onSort={props.onSort}
              align="right"
              class="hidden md:table-cell"
            />
            <th scope="col" aria-label="Watchlist" class="w-9 px-1 py-2 sm:w-10 sm:px-2" />
          </tr>
        </thead>

        <tbody>
          <Show
            when={!props.loading}
            fallback={
              <Index each={Array.from({ length: 8 })}>
                {() => (
                  <tr class="border-b border-line/60">
                    <td class="hidden px-3 py-3 sm:table-cell">
                      <Skeleton class="ml-auto h-3 w-4" />
                    </td>
                    <td class="px-3 py-3">
                      <div class="flex items-center gap-2.5">
                        <Skeleton class="h-7 w-7" />
                        <div class="space-y-1.5">
                          <Skeleton class="h-3 w-24" />
                          <Skeleton class="h-2 w-10" />
                        </div>
                      </div>
                    </td>
                    <td class="hidden px-3 py-3 xl:table-cell">
                      <Skeleton class="h-1 w-28" />
                    </td>
                    <td class="px-3 py-3">
                      <Skeleton class="ml-auto h-3 w-16" />
                    </td>
                    <td class="px-3 py-3">
                      <Skeleton class="ml-auto h-3 w-12" />
                    </td>
                    <td class="hidden px-3 py-3 md:table-cell">
                      <Skeleton class="ml-auto h-3 w-14" />
                    </td>
                    <td class="px-2 py-3" />
                  </tr>
                )}
              </Index>
            }
          >
            <For
              each={props.coins}
              fallback={
                <tr>
                  <td colspan={7}>{props.empty}</td>
                </tr>
              }
            >
              {(coin) => (
                <tr class="border-b border-line/60 transition-colors last:border-0 hover:bg-white/[0.025]">
                  <td class="hidden px-3 py-2.5 text-right sm:table-cell">
                    <span class="font-mono text-[11px] tabular-nums text-dim">{coin.rank}</span>
                  </td>

                  <td class="px-2 py-2.5 sm:px-3">
                    <A
                      href={`/coin/${coin.id}`}
                      class="flex min-w-0 items-center gap-2.5"
                      aria-label={`Open ${coin.name}`}
                    >
                      <CoinIcon symbol={coin.symbol} size="sm" />
                      <span class="min-w-0">
                        <span class="block truncate text-[13px] font-medium leading-tight text-fg">
                          {coin.name}
                        </span>
                        <span class="mt-0.5 flex items-baseline gap-1.5 text-[11px] text-dim">
                          <span class="font-mono">{coin.symbol}</span>
                          <span class="text-dim/60 sm:hidden">·</span>
                          <span class="font-mono tabular-nums sm:hidden">
                            {formatPrice(coin.price)}
                          </span>
                        </span>
                      </span>
                    </A>
                  </td>

                  <td class="hidden px-3 py-2.5 xl:table-cell">
                    <RangeMeter
                      position={rangePosition(coin.price, coin.low, coin.high)}
                      low={coin.low}
                      high={coin.high}
                      class="w-[120px]"
                    />
                  </td>

                  <td class="hidden px-3 py-2.5 text-right sm:table-cell">
                    <A href={`/coin/${coin.id}`} class="inline-block">
                      <Price value={coin.price} size="sm" />
                    </A>
                  </td>

                  <td class="max-sm:w-[84px] px-2 py-2.5 text-right sm:px-3">
                    <Change value={coin.change} size="sm" flash />
                  </td>

                  <td class="hidden px-3 py-2.5 text-right font-mono text-[11px] tabular-nums text-muted md:table-cell">
                    {compact(coin.quoteVolume)}
                  </td>

                  <td class="px-1 py-2.5 text-right sm:px-2">
                    <WatchButton
                      watched={props.isWatched(coin.id)}
                      symbol={coin.symbol}
                      onToggle={() => props.onWatch(coin.id)}
                    />
                  </td>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>
    </div>
  );
}
