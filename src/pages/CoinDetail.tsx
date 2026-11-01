import {
  Index,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
} from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { useMarket } from '../lib/market';
import { useToast } from '../lib/toast';
import { compact, price as formatPrice, rangePosition, time, usdCompact } from '../lib/format';
import { Button, Change, CoinIcon, Empty, Panel, Price, RangeMeter, Skeleton } from '../components/ui';
import { Icon } from '../components/Icon';
import { PriceChart } from '../components/PriceChart';
import { OrderBook } from '../components/OrderBook';
import { RecentTrades } from '../components/RecentTrades';

function CoinSkeleton() {
  return (
    <div class="space-y-5">
      <div class="flex items-center gap-3 border-b border-line pb-5">
        <Skeleton class="h-11 w-11" />
        <div class="space-y-2">
          <Skeleton class="h-5 w-40" />
          <Skeleton class="h-7 w-32" />
        </div>
      </div>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton class="h-[420px] rounded-lg" />
        <div class="space-y-4">
          <Skeleton class="h-64 rounded-lg" />
          <Skeleton class="h-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function CoinDetail() {
  const params = useParams<{ id: string }>();
  const market = useMarket();
  const toast = useToast();

  const coin = createMemo(() => market.coinById(params.id));
  const fatalError = () => (coin() ? undefined : market.error());
  const watched = () => market.isWatched(params.id);
  const [copied, setCopied] = createSignal(false);
  let copyTimer: number | undefined;

  const stats = createMemo<{ label: string; value: string; tone?: string }[]>(() => {
    const c = coin();
    if (!c) return [];
    return [
      { label: 'Open', value: formatPrice(c.open) },
      { label: 'High', value: formatPrice(c.high), tone: 'text-up' },
      { label: 'Low', value: formatPrice(c.low), tone: 'text-down' },
      { label: 'Volume', value: usdCompact(c.quoteVolume) },
      { label: 'Base volume', value: `${compact(c.volume)} ${c.symbol}` },
      { label: 'Trades', value: compact(c.trades) },
      { label: 'Weighted avg', value: formatPrice(c.weightedAvg) },
      { label: 'Rank', value: `#${c.rank}` },
    ];
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.show({ message: 'Link copied', tone: 'success' });
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.show({ message: 'Could not copy the link', tone: 'danger' });
    }
  };

  createEffect(
    on(coin, (c) => {
      document.title = c
        ? `${c.name} (${c.symbol}) — CryptoFlow`
        : 'CryptoFlow — Live Market Terminal';
    }),
  );

  onCleanup(() => {
    window.clearTimeout(copyTimer);
    document.title = 'CryptoFlow — Live Market Terminal';
  });

  return (
    <div class="space-y-4">
      <div class="flex items-center gap-1.5 text-[11px] text-dim">
        <A href="/" class="transition-colors hover:text-fg">
          Markets
        </A>
        <Icon name="chevronRight" size={10} />
        <span class="text-muted">{coin()?.name ?? params.id.toUpperCase()}</span>
      </div>

      <Show when={market.ready()} fallback={<CoinSkeleton />}>
        <Switch
          fallback={
            <Panel flush>
              <Empty
                title="Asset not tracked"
                body="CryptoFlow tracks the top 100 USDT pairs by 24-hour volume. This asset is outside that set or does not exist."
                action={
                  <A href="/">
                    <Button variant="secondary" size="sm">
                      Back to markets
                    </Button>
                  </A>
                }
              />
            </Panel>
          }
        >
          <Match when={fatalError()}>
            {(error) => (
              <Panel flush>
                <Empty
                  icon="alert"
                  iconClass="text-down"
                  title="Market data unavailable"
                  body={error().message}
                  action={
                    <Button variant="secondary" size="sm" onClick={market.refresh}>
                      Try again
                    </Button>
                  }
                />
              </Panel>
            )}
          </Match>

          <Match when={coin()}>
            {(c) => (
              <div class="space-y-5">
                <header class="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div class="flex items-start gap-3">
                    <CoinIcon symbol={c().symbol} size="xl" class="h-14 w-14" />
                    <div>
                      <div class="flex flex-wrap items-baseline gap-2">
                        <h1 class="text-[20px] font-semibold tracking-tight text-fg">
                          {c().name}
                        </h1>
                        <span class="font-mono text-[11px] text-dim">{c().symbol}</span>
                        <span class="font-mono text-[11px] text-dim">#{c().rank}</span>
                      </div>

                      <div class="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <Price value={c().price} size="xl" />
                        <span class="flex items-baseline gap-1.5">
                          <Change value={c().change} size="lg" flash />
                          <span class="text-[11px] text-dim">24h</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <Button
                      variant={watched() ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => market.toggleWatch(params.id)}
                      class={watched() ? 'text-fg' : ''}
                    >
                      <Icon name="star" size={12} fill={watched()} />
                      {watched() ? 'Watching' : 'Watch'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyLink}
                      title="Copy asset link"
                      aria-label="Copy asset link"
                    >
                      <Icon name={copied() ? 'check' : 'link'} size={14} />
                    </Button>
                  </div>
                </header>

                <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div class="min-w-0 space-y-4">
                    <PriceChart symbol={c().symbol} live={c().price} />

                    <div class="grid gap-4 md:grid-cols-2">
                      <OrderBook symbol={c().symbol} />
                      <RecentTrades symbol={c().symbol} />
                    </div>
                  </div>

                  <aside class="space-y-4">
                    <Panel>
                      <div class="flex items-baseline justify-between">
                        <h2 class="text-[13px] font-medium text-fg">Statistics</h2>
                        <span class="text-[11px] text-dim">24h</span>
                      </div>

                      <dl class="mt-2">
                        <Index each={stats()}>
                          {(stat) => (
                            <div class="flex items-center justify-between border-b border-line/60 py-2 last:border-0">
                              <dt class="text-[12px] text-dim">{stat().label}</dt>
                              <dd
                                class={`font-mono text-[12px] tabular-nums ${stat().tone ?? 'text-fg'}`}
                              >
                                {stat().value}
                              </dd>
                            </div>
                          )}
                        </Index>
                      </dl>
                    </Panel>

                    <Panel>
                      <div class="flex items-baseline justify-between">
                        <h2 class="text-[13px] font-medium text-fg">24h range</h2>
                        <span class="text-[11px] text-dim">Low / High</span>
                      </div>

                      <RangeMeter
                        position={rangePosition(c().price, c().low, c().high)}
                        low={c().low}
                        high={c().high}
                        labels
                        marker="fg"
                        class="mt-4"
                      />

                      <div class="mt-4 flex items-center justify-between border-t border-line/70 pt-3">
                        <span class="text-[12px] text-dim">Current</span>
                        <span class="font-mono text-[12px] tabular-nums text-fg">
                          {formatPrice(c().price)}
                        </span>
                      </div>
                    </Panel>

                    <Panel>
                      <h2 class="text-[13px] font-medium text-fg">Market info</h2>
                      <dl class="mt-3 space-y-2 text-[12px]">
                        <div class="flex items-center justify-between">
                          <dt class="text-dim">Pair</dt>
                          <dd class="font-mono text-muted">{c().symbol}/USDT</dd>
                        </div>
                        <div class="flex items-center justify-between">
                          <dt class="text-dim">Venue</dt>
                          <dd class="text-muted">Binance spot</dd>
                        </div>
                        <div class="flex items-center justify-between">
                          <dt class="text-dim">Last tick</dt>
                          <dd class="font-mono text-muted">
                            {market.lastTick() ? `${time(market.lastTick())} UTC` : '—'}
                          </dd>
                        </div>
                      </dl>

                      <a
                        href={`https://www.binance.com/en/trade/${c().symbol}_USDT`}
                        target="_blank"
                        rel="noreferrer"
                        class="mt-4 flex items-center justify-between rounded-md border border-line px-3 py-2 text-[12px] text-muted transition-colors hover:border-[#35383d] hover:text-fg"
                      >
                        Open on Binance
                        <Icon name="external" size={12} />
                      </a>
                    </Panel>
                  </aside>
                </div>
              </div>
            )}
          </Match>
        </Switch>
      </Show>
    </div>
  );
}
