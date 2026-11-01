import {
  For,
  JSX,
  Match,
  Show,
  Switch,
  createDeferred,
  createMemo,
  onCleanup,
  onMount,
} from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import { useMarket } from '../lib/market';
import { time, usdCompact } from '../lib/format';
import type { Direction, SortKey } from '../lib/types';
import { Button, Empty, Kbd, Panel, Segmented } from '../components/ui';
import { Icon } from '../components/Icon';
import { CoinTable } from '../components/CoinTable';
import { CoinGrid } from '../components/CoinGrid';

const SORT_KEYS = ['rank', 'name', 'price', 'change', 'volume'] as const;

const VIEW_OPTIONS = [
  { value: 'table', label: 'Table', icon: 'rows' },
  { value: 'grid', label: 'Grid', icon: 'grid' },
] as const;

const MOBILE_SORTS: { value: SortKey; label: string }[] = [
  { value: 'rank', label: 'Rank' },
  { value: 'price', label: 'Price' },
  { value: 'change', label: '24h' },
  { value: 'volume', label: 'Volume' },
];

interface MarketParams {
  [key: string]: string | string[] | undefined;
  q?: string;
  sort?: string;
  dir?: string;
  view?: string;
  watch?: string;
}

function Overview() {
  const market = useMarket();
  const stats = () => market.stats();

  return (
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-[20px] font-semibold tracking-tight text-fg">Markets</h1>
        <p class="mt-1 text-[13px] text-muted">
          Top 100 USDT pairs by 24-hour volume on Binance.
        </p>

        <p class="mt-2 flex flex-wrap items-center gap-x-2 font-mono text-[11px] tabular-nums text-dim">
          <Show when={market.ready()} fallback={<span>Loading snapshot…</span>}>
            <span>{stats().total} pairs</span>
            <span>·</span>
            <span>{usdCompact(stats().volume)} volume</span>
            <span>·</span>
            <span class="text-up">{stats().gainers} up</span>
            <span class="text-down">{stats().losers} down</span>
            <span class="hidden sm:inline">·</span>
            <span class="hidden sm:inline">
              {market.lastTick() ? `updated ${time(market.lastTick())} UTC` : 'waiting for data'}
            </span>
          </Show>
        </p>
      </div>
    </header>
  );
}

export default function Dashboard() {
  const market = useMarket();
  const [params, setParams] = useSearchParams<MarketParams>();
  let searchInput: HTMLInputElement | undefined;

  const queryText = () => params.q ?? '';
  const deferredQuery = createDeferred(queryText, { timeoutMs: 140 });

  const sort = (): SortKey => {
    const value = params.sort as SortKey | undefined;
    return value && SORT_KEYS.includes(value) ? value : 'rank';
  };

  const direction = (): Direction => {
    if (params.dir === 'asc' || params.dir === 'desc') return params.dir;
    return sort() === 'rank' || sort() === 'name' ? 'asc' : 'desc';
  };

  const view = (): 'table' | 'grid' => (params.view === 'grid' ? 'grid' : 'table');
  const watchOnly = () => params.watch === '1';

  const filtered = createMemo(() => {
    const term = deferredQuery().trim().toLowerCase();
    const watchedOnly = watchOnly();

    return market.coins().filter((coin) => {
      if (watchedOnly && !market.isWatched(coin.id)) return false;
      if (!term) return true;
      return (
        coin.name.toLowerCase().includes(term) || coin.symbol.toLowerCase().includes(term)
      );
    });
  });

  const sorted = createMemo(() => {
    const key = sort();
    const multiplier = direction() === 'asc' ? 1 : -1;
    const list = filtered();

    return [...list].sort((a, b) => {
      if (key === 'name') return a.symbol.localeCompare(b.symbol) * multiplier;
      if (key === 'rank') return (a.rank - b.rank) * multiplier;
      if (key === 'price') return (a.price - b.price) * multiplier;
      if (key === 'change') return (a.change - b.change) * multiplier;
      return (a.quoteVolume - b.quoteVolume) * multiplier;
    });
  });

  const update = (patch: Partial<MarketParams>, replace = false) => {
    setParams(patch, { replace, scroll: false });
  };

  const toggleSort = (field: SortKey) => {
    if (sort() === field) {
      update({ dir: direction() === 'desc' ? 'asc' : 'desc' }, true);
    } else {
      update({
        sort: field,
        dir: field === 'rank' || field === 'name' ? 'asc' : 'desc',
      });
    }
  };

  const clearFilters = () => {
    update({ q: undefined, watch: undefined, sort: undefined, dir: undefined });
  };

  const emptyState = (): JSX.Element => (
    <Switch
      fallback={
        <Empty icon="spark" title="No markets available" body="The market snapshot is empty." />
      }
    >
      <Match when={watchOnly()}>
        <Empty
          icon="star"
          title="Your watchlist is empty"
          body="Star a market to keep it here."
          action={
            <Button variant="secondary" size="sm" onClick={() => update({ watch: undefined }, true)}>
              Browse all markets
            </Button>
          }
        />
      </Match>

      <Match when={queryText()}>
        {(term) => (
          <Empty
            icon="search"
            title="No markets match"
            body={`Nothing in the top 100 tracks “${term()}”.`}
            action={
              <Button variant="secondary" size="sm" onClick={() => update({ q: undefined }, true)}>
                Clear search
              </Button>
            }
          />
        )}
      </Match>
    </Switch>
  );

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (target?.closest('[role="dialog"]')) return;

      if (event.key === 'Escape') {
        if (queryText() || watchOnly()) {
          clearFilters();
          if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') target.blur();
        }
        return;
      }

      const editing =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (editing) return;

      if (event.key === '/') {
        event.preventDefault();
        searchInput?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown));
  });

  return (
    <div class="space-y-3">
      <Overview />

      <div class="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative w-full sm:max-w-[300px]">
          <Icon
            name="search"
            size={14}
            class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim"
          />
          <input
            id="market-search"
            ref={(el) => (searchInput = el)}
            type="text"
            value={queryText()}
            onInput={(event) => update({ q: event.currentTarget.value || undefined }, true)}
            placeholder="Search markets"
            autocomplete="off"
            spellcheck={false}
            class="h-8 w-full rounded-md border border-line bg-panel pl-8 pr-12 text-[12px] text-fg outline-none transition-colors placeholder:text-dim focus:border-[#3c4046]"
          />
          <div class="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center">
            <Show when={queryText()} fallback={<Kbd>/</Kbd>}>
              <button
                type="button"
                onClick={() => update({ q: undefined }, true)}
                class="flex h-5 w-5 items-center justify-center rounded text-dim transition-colors hover:bg-white/[0.06] hover:text-fg"
                aria-label="Clear search"
              >
                <Icon name="x" size={11} />
              </button>
            </Show>
          </div>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => update({ watch: watchOnly() ? undefined : '1' }, true)}
            aria-pressed={watchOnly()}
            classList={{
              'border-line bg-[#1c1e22] text-fg': watchOnly(),
              'border-line bg-panel text-muted hover:text-fg': !watchOnly(),
            }}
            class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition-colors"
          >
            <Icon name="star" size={12} fill={watchOnly()} />
            Watchlist
          </button>

          <Segmented
            value={view()}
            options={VIEW_OPTIONS}
            onChange={(value) => update({ view: value === 'table' ? undefined : value }, true)}
            class="shrink-0"
          />

          <Show when={queryText() || watchOnly() || sort() !== 'rank'}>
            <Button variant="ghost" size="sm" onClick={clearFilters} class="shrink-0">
              Clear
            </Button>
          </Show>
        </div>
      </div>

      <div class="flex items-center justify-between pt-1 sm:hidden">
        <div class="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <For each={MOBILE_SORTS}>
            {(item) => (
              <button
                type="button"
                onClick={() => toggleSort(item.value)}
                classList={{
                  'text-fg': sort() === item.value,
                  'text-dim': sort() !== item.value,
                }}
                class="inline-flex shrink-0 items-center gap-1 text-[12px] transition-colors hover:text-fg"
              >
                {item.label}
                <Show when={sort() === item.value}>
                  <Icon name={direction() === 'asc' ? 'arrowUp' : 'arrowDown'} size={10} />
                </Show>
              </button>
            )}
          </For>
        </div>
        <span class="shrink-0 font-mono text-[11px] text-dim">{sorted().length}</span>
      </div>

      <Show
        when={!market.error() || market.coins().length}
        fallback={
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
        }
      >
        <div class="pt-1">
          <Show
            when={view() === 'table'}
            fallback={
              <CoinGrid
                coins={sorted()}
                loading={market.loading()}
                isWatched={market.isWatched}
                onWatch={market.toggleWatch}
                empty={emptyState()}
              />
            }
          >
            <CoinTable
              coins={sorted()}
              loading={market.loading()}
              sort={sort()}
              direction={direction()}
              onSort={toggleSort}
              isWatched={market.isWatched}
              onWatch={market.toggleWatch}
              empty={emptyState()}
            />
          </Show>
        </div>
      </Show>
    </div>
  );
}
