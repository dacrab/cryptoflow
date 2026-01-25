import { Component, Index, Show, Switch, Match } from 'solid-js';
import { A } from '@solidjs/router';
import type { Coin, SortField } from '../types';
import type { ConnectionState } from '../api';
import { Card, Price, ConnectionIndicator, ListSkeleton, StarIcon, CoinAvatar } from './ui';
import Sparkline from './Sparkline';

interface Props {
  coins: Coin[];
  loading: boolean;
  error: Error | null;
  sortField: SortField;
  sortDir: 'asc' | 'desc';
  onSort: (f: SortField) => void;
  isWatched: (id: string) => boolean;
  onWatch: (id: string) => void;
  emptyMsg?: string;
  connectionState?: ConnectionState;
  onReconnect?: () => void;
}

const CoinList: Component<Props> = (props) => {
  const SortBtn: Component<{ field: SortField; label: string }> = (p) => {
    const active = () => props.sortField === p.field;
    return (
      <button onClick={() => props.onSort(p.field)} class={`flex items-center gap-1 text-[10px] uppercase tracking-wider transition-colors ${active() ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
        {p.label}
        <Show when={active()}><span class="text-emerald-400">{props.sortDir === 'asc' ? '↑' : '↓'}</span></Show>
      </button>
    );
  };

  return (
    <Card padding="none" class="overflow-hidden">
      <div class="hidden sm:grid grid-cols-[2rem_1fr_6rem_auto_2rem] items-center gap-3 px-3 py-2 border-b border-zinc-800/50 bg-zinc-900/30">
        <span class="text-[10px] text-zinc-600 text-right">#</span>
        <SortBtn field="market_cap" label="Name" />
        <span class="text-[10px] text-zinc-600">7D</span>
        <div class="flex gap-4 justify-end">
          <SortBtn field="price" label="Price" />
          <SortBtn field="change_24h" label="24h" />
        </div>
        <span />
      </div>

      <Switch>
        <Match when={props.loading && !props.coins.length}><ListSkeleton rows={10} /></Match>
        <Match when={props.error}>
          <div class="py-12 text-center">
            <div class="text-red-400 mb-2">Failed to load</div>
            <div class="text-sm text-zinc-600">{props.error?.message}</div>
          </div>
        </Match>
        <Match when={!props.coins.length}>
          <div class="py-12 text-center text-zinc-500">{props.emptyMsg ?? 'No coins found'}</div>
        </Match>
        <Match when={props.coins.length > 0}>
          <div class="divide-y divide-zinc-800/30">
            <Index each={props.coins}>
              {(coin, i) => (
                <A href={`/coin/${coin().id}`} class="group grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_6rem_auto_2rem] items-center gap-2 sm:gap-3 px-3 py-3 hover:bg-white/[0.02] transition-colors">
                  <span class="text-xs text-zinc-600 text-right font-mono">{i + 1}</span>
                  <div class="flex items-center gap-3 min-w-0">
                    <CoinAvatar src={coin().image} symbol={coin().symbol} size="md" />
                    <div class="min-w-0">
                      <div class="font-medium text-sm truncate flex items-center gap-2">
                        {coin().name}
                        <Show when={props.isWatched(coin().id)}><span class="text-amber-400 text-xs">★</span></Show>
                      </div>
                      <div class="text-xs text-zinc-500 uppercase">{coin().symbol}</div>
                    </div>
                  </div>
                  <div class="hidden sm:block h-8 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Sparkline data={coin().sparkline_in_7d?.price} up={coin().price_change_percentage_24h >= 0} livePrice={coin().current_price} />
                  </div>
                  <Price price={coin().current_price} change={coin().price_change_percentage_24h} size="md" />
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); props.onWatch(coin().id); }}
                    class={`hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-all ${props.isWatched(coin().id) ? 'text-amber-400 hover:bg-amber-400/10' : 'text-zinc-700 hover:text-zinc-400 hover:bg-white/5 opacity-0 group-hover:opacity-100'}`}
                  >
                    <StarIcon filled={props.isWatched(coin().id)} />
                  </button>
                </A>
              )}
            </Index>
          </div>
        </Match>
      </Switch>

      <Show when={props.coins.length > 0 && !props.loading}>
        <div class="px-3 py-2 border-t border-zinc-800/50 flex items-center justify-end">
          <ConnectionIndicator state={props.connectionState ?? 'disconnected'} onReconnect={props.onReconnect} />
        </div>
      </Show>
    </Card>
  );
};

export default CoinList;
