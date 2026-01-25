import { Component, Show, Index, onMount, onCleanup, createMemo, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { useStore } from '../store';
import type { Coin } from '../types';
import { compactNum } from '../utils';
import Header from '../components/Header';
import CoinList from '../components/CoinList';
import Sparkline from '../components/Sparkline';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Card, StatCard, Price, CoinAvatar } from '../components/ui';

const Dashboard: Component = () => {
  const store = useStore();
  const [selected, setSelected] = createSignal<Coin | null>(null);

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === '/') { e.preventDefault(); document.querySelector<HTMLInputElement>('input')?.focus(); }
      if (e.key === 'r') store.refetch();
      if (e.key === 'w') store.toggleWatchlistOnly();
      if (e.key === 'Escape') { store.clearSearch(); setSelected(null); }
    };
    window.addEventListener('keydown', onKey);
    const interval = setInterval(store.refetch, 300_000);
    onCleanup(() => { window.removeEventListener('keydown', onKey); clearInterval(interval); });
  });

  const isLive = () => store.connectionState() === 'connected';

  const topMovers = createMemo(() => {
    const coins = store.coins();
    if (!coins.length) return { up: [], down: [] };
    const sorted = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    return { up: sorted.slice(0, 5), down: sorted.slice(-5).reverse() };
  });

  const marketStats = createMemo(() => {
    const coins = store.coins();
    let mcap = 0, vol = 0;
    for (const c of coins) { mcap += c.market_cap; vol += c.total_volume; }
    return { mcap, vol, up: store.stats().gainers, down: store.stats().losers };
  });

  const preview = createMemo(() => selected() || store.sorted()[0] || null);

  const MiniRow: Component<{ coin: Coin }> = (p) => (
    <button onClick={() => setSelected(p.coin)} class="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors text-left">
      <CoinAvatar src={p.coin.image} symbol={p.coin.symbol} size="sm" />
      <span class="flex-1 text-sm font-medium truncate">{p.coin.symbol.toUpperCase()}</span>
      <Price price={p.coin.current_price} change={p.coin.price_change_percentage_24h} size="sm" />
    </button>
  );

  return (
    <div class="min-h-screen bg-[#09090b]">
      <Header />
      <main class="py-6">
        <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard label="Market Cap" value={`$${compactNum(marketStats().mcap)}`} live={isLive()} />
              <StatCard label="24h Volume" value={`$${compactNum(marketStats().vol)}`} live={isLive()} />
              <StatCard label="Gainers" value={marketStats().up} variant="success" live={isLive()} />
              <StatCard label="Losers" value={marketStats().down} variant="danger" live={isLive()} />
            </div>

            <div class="grid lg:grid-cols-[260px_1fr_300px] gap-6">
              <aside class="hidden lg:block space-y-4">
                <Card padding="none">
                  <div class="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span class="text-xs font-medium text-zinc-400">Top Gainers</span>
                  </div>
                  <Index each={topMovers().up}>{(coin) => <MiniRow coin={coin()} />}</Index>
                </Card>
                <Card padding="none">
                  <div class="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span class="text-xs font-medium text-zinc-400">Top Losers</span>
                  </div>
                  <Index each={topMovers().down}>{(coin) => <MiniRow coin={coin()} />}</Index>
                </Card>
              </aside>

              <section class="min-w-0">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <h2 class="text-sm font-medium text-zinc-300">
                      {store.state.watchlistOnly ? 'Watchlist' : store.state.search ? 'Results' : 'All Coins'}
                    </h2>
                    <Show when={!store.loading()}><span class="text-xs text-zinc-600">{store.stats().filtered}</span></Show>
                  </div>
                  <Show when={store.state.search || store.state.watchlistOnly}>
                    <button onClick={() => { store.clearSearch(); store.setWatchlistOnly(false); }} class="text-xs text-zinc-500 hover:text-white transition-colors">Clear</button>
                  </Show>
                </div>
                <CoinList
                  coins={store.sorted()}
                  loading={store.loading()}
                  error={store.error() ?? null}
                  sortField={store.state.sort.field}
                  sortDir={store.state.sort.direction}
                  onSort={store.setSort}
                  isWatched={store.isWatched}
                  onWatch={store.toggleWatch}
                  emptyMsg={store.state.search ? `No results for "${store.state.search}"` : 'No coins'}
                  connectionState={store.connectionState()}
                  onReconnect={store.reconnect}
                />
              </section>

              <aside class="hidden lg:block space-y-4">
                <Show when={preview()}>
                  {(c) => (
                    <Card>
                      <div class="flex items-center gap-3 mb-4">
                        <CoinAvatar src={c().image} symbol={c().symbol} size="lg" />
                        <div>
                          <div class="font-medium">{c().name}</div>
                          <div class="text-xs text-zinc-500">{c().symbol.toUpperCase()} · #{c().market_cap_rank}</div>
                        </div>
                      </div>
                      <div class="mb-4"><Price price={c().current_price} change={c().price_change_percentage_24h} size="lg" class="text-left" /></div>
                      <div class="h-20 mb-4"><Sparkline data={c().sparkline_in_7d?.price} up={c().price_change_percentage_24h >= 0} livePrice={c().current_price} /></div>
                      <div class="grid grid-cols-2 gap-3 text-xs mb-4">
                        <div><div class="text-zinc-500 mb-0.5">Market Cap</div><div class="font-mono">${compactNum(c().market_cap)}</div></div>
                        <div><div class="text-zinc-500 mb-0.5">Volume</div><div class="font-mono">${compactNum(c().total_volume)}</div></div>
                      </div>
                      <A href={`/coin/${c().id}`} class="block w-full py-2 text-center text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors">View Details →</A>
                    </Card>
                  )}
                </Show>
                <Show when={store.watched().length > 0}>
                  <Card padding="none">
                    <div class="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
                      <svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                      <span class="text-xs font-medium text-zinc-400">Watchlist</span>
                      <span class="text-xs text-zinc-600 ml-auto">{store.watched().length}</span>
                    </div>
                    <div class="max-h-64 overflow-y-auto">
                      <Index each={store.watched()}>{(coin) => <MiniRow coin={coin()} />}</Index>
                    </div>
                  </Card>
                </Show>
                <div class="text-[10px] text-zinc-600 space-y-1 px-1">
                  <div class="flex gap-2"><kbd class="px-1 bg-zinc-800 rounded">/</kbd> Search</div>
                  <div class="flex gap-2"><kbd class="px-1 bg-zinc-800 rounded">W</kbd> Watchlist</div>
                  <div class="flex gap-2"><kbd class="px-1 bg-zinc-800 rounded">R</kbd> Refresh</div>
                </div>
              </aside>
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
