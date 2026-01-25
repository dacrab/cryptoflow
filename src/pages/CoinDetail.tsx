import { Component, createResource, Show, Switch, Match, createMemo, onMount, For } from 'solid-js';
import { useParams } from '@solidjs/router';
import { useStore } from '../store';
import { getCoin, prefetch } from '../api';
import { fmt, pct, compactNum } from '../utils';
import Header from '../components/Header';
import PriceChart from '../components/PriceChart';
import OrderBook from '../components/OrderBook';
import RecentTrades from '../components/RecentTrades';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Card, Button, Skeleton, ConnectionIndicator, StarIcon, Price, CoinAvatar, MiniStatCard, SKELETON_ROWS_8 } from '../components/ui';

const CoinDetail: Component = () => {
  const params = useParams<{ id: string }>();
  const store = useStore();
  const [coin] = createResource(() => params.id, getCoin);

  onMount(() => prefetch(params.id));

  const isWatched = () => store.isWatched(params.id);
  const storeCoin = createMemo(() => store.getCoinById(params.id));
  const isLive = () => store.connectionState() === 'connected' && !!storeCoin();

  const price = () => storeCoin()?.current_price ?? coin()?.market_data.current_price.usd ?? 0;
  const change = () => storeCoin()?.price_change_percentage_24h ?? coin()?.market_data.price_change_percentage_24h ?? 0;
  const volume = () => storeCoin()?.total_volume ?? coin()?.market_data.total_volume.usd ?? 0;
  const high = () => storeCoin()?.high_24h ?? coin()?.market_data.high_24h.usd ?? 0;
  const low = () => storeCoin()?.low_24h ?? coin()?.market_data.low_24h.usd ?? 0;

  return (
    <div class="min-h-screen bg-[#09090b]">
      <Header />
      <main class="py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Switch>
              <Match when={coin.loading}>
                <div class="grid lg:grid-cols-[1fr_340px] gap-6">
                  <div class="space-y-6">
                    <div class="flex items-center gap-4">
                      <Skeleton class="w-14 h-14 rounded-full" />
                      <div class="space-y-2"><Skeleton class="w-40 h-6" /><Skeleton class="w-32 h-8" /></div>
                    </div>
                    <Card><Skeleton class="w-full h-56" /></Card>
                    <div class="grid md:grid-cols-2 gap-4">
                      <Skeleton class="h-80 rounded-xl" />
                      <Skeleton class="h-80 rounded-xl" />
                    </div>
                  </div>
                  <div class="space-y-4">
                    <Card class="space-y-3">
                      <Skeleton class="w-24 h-4" />
                      <div class="grid grid-cols-2 gap-3">
                        <For each={SKELETON_ROWS_8}>{() => <Skeleton class="h-14 rounded-lg" />}</For>
                      </div>
                    </Card>
                  </div>
                </div>
              </Match>

              <Match when={coin.error}>
                <div class="py-12 text-center">
                  <div class="text-red-400 mb-2">Failed to load coin</div>
                  <div class="text-sm text-zinc-600">{coin.error?.message}</div>
                </div>
              </Match>

              <Match when={coin()}>
                {(c) => (
                  <div class="grid lg:grid-cols-[1fr_340px] gap-6">
                    <div class="space-y-6">
                      <div class="flex items-start justify-between gap-4">
                        <div class="flex items-center gap-4">
                          <CoinAvatar src={c().image.large} symbol={c().symbol} size="xl" class="ring-2 ring-white/10" />
                          <div>
                            <div class="flex items-center gap-2 mb-1">
                              <h1 class="text-2xl font-semibold">{c().name}</h1>
                              <span class="text-sm text-zinc-500 uppercase">{c().symbol}</span>
                              <span class="px-2 py-0.5 text-xs text-zinc-400 bg-white/5 rounded-full">#{c().market_cap_rank}</span>
                            </div>
                            <div class="flex items-baseline gap-2">
                              <Price price={price()} change={change()} size="lg" class="text-left" />
                              <ConnectionIndicator state={store.connectionState()} onReconnect={store.reconnect} class="ml-2" />
                            </div>
                          </div>
                        </div>
                        <Button variant={isWatched() ? 'secondary' : 'ghost'} onClick={() => store.toggleWatch(params.id)} class={isWatched() ? 'text-amber-400' : ''}>
                          <StarIcon filled={isWatched()} />
                          {isWatched() ? 'Watching' : 'Watch'}
                        </Button>
                      </div>

                      <Card><PriceChart coinId={params.id} symbol={c().symbol.toUpperCase()} livePrice={storeCoin()?.current_price} /></Card>

                      <div class="grid md:grid-cols-2 gap-4">
                        <OrderBook coinId={params.id} />
                        <RecentTrades coinId={params.id} />
                      </div>

                      <Show when={c().description?.en}>
                        <Card>
                          <h2 class="text-sm font-medium text-zinc-300 mb-3">About {c().name}</h2>
                          <p class="text-sm text-zinc-400 leading-relaxed line-clamp-4" innerHTML={c().description.en.split('. ').slice(0, 4).join('. ') + '.'} />
                        </Card>
                      </Show>
                    </div>

                    <div class="space-y-4">
                      <Card>
                        <div class="flex items-center justify-between mb-4">
                          <h2 class="text-sm font-medium text-zinc-300">Market Stats</h2>
                          <ConnectionIndicator state={store.connectionState()} onReconnect={store.reconnect} />
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                          <MiniStatCard label="Market Cap" value={`$${compactNum(c().market_data.market_cap.usd)}`} />
                          <MiniStatCard label="Volume (24h)" value={`$${compactNum(volume())}`} live={isLive()} />
                          <MiniStatCard label="24h High" value={fmt(high())} live={isLive()} />
                          <MiniStatCard label="24h Low" value={fmt(low())} live={isLive()} />
                          <MiniStatCard label="24h Change" value={pct(change())} variant={change() >= 0 ? 'success' : 'danger'} live={isLive()} />
                          <MiniStatCard label="7d Change" value={pct(c().market_data.price_change_percentage_7d)} variant={c().market_data.price_change_percentage_7d >= 0 ? 'success' : 'danger'} />
                          <MiniStatCard label="Circulating" value={compactNum(c().market_data.circulating_supply)} />
                          <MiniStatCard label="Total Supply" value={c().market_data.total_supply ? compactNum(c().market_data.total_supply) : '∞'} />
                        </div>
                      </Card>

                      <Card>
                        <h2 class="text-sm font-medium text-zinc-300 mb-4">24h Price Range</h2>
                        <div class="space-y-3">
                          <div class="flex justify-between text-xs">
                            <span class="text-zinc-500">{fmt(low())}</span>
                            <span class="text-zinc-500">{fmt(high())}</span>
                          </div>
                          <div class="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div class="absolute h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full w-full" />
                            <div 
                              class="absolute w-3 h-3 bg-white rounded-full top-1/2 shadow-lg border-2 border-zinc-900"
                              style={{ left: `${high() > low() ? Math.min(100, Math.max(0, ((price() - low()) / (high() - low())) * 100)) : 50}%`, transform: 'translate(-50%, -50%)' }}
                            />
                          </div>
                          <div class="text-center">
                            <span class="text-xs text-zinc-400">Current: </span>
                            <span class="text-xs font-mono text-white">{fmt(price())}</span>
                          </div>
                        </div>
                      </Card>

                      <Card>
                        <h2 class="text-sm font-medium text-zinc-300 mb-4">Trading Info</h2>
                        <div class="space-y-3 text-xs">
                          <div class="flex justify-between"><span class="text-zinc-500">Symbol</span><span class="font-mono text-zinc-300">{c().symbol.toUpperCase()}/USDT</span></div>
                          <div class="flex justify-between"><span class="text-zinc-500">Exchange</span><span class="text-zinc-300">Binance</span></div>
                          <div class="flex justify-between"><span class="text-zinc-500">Data Source</span><span class="text-zinc-300">Binance API</span></div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </Match>
            </Switch>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default CoinDetail;
