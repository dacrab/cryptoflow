import {
  Accessor,
  ParentComponent,
  batch,
  createContext,
  createEffect,
  createMemo,
  createResource,
  createSelector,
  createSignal,
  on,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { createStore, produce, reconcile } from 'solid-js/store';
import { fetchTickers, parseTickerStream, TICKER_STREAM } from './api';
import { useToast } from './toast';
import type { Coin, ConnectionState } from './types';

const WATCHLIST_KEY = 'cryptoflow:watchlist';
const DEFAULT_WATCHLIST = ['btc', 'eth', 'sol'];

function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (!raw) return DEFAULT_WATCHLIST;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string')
      ? parsed
      : DEFAULT_WATCHLIST;
  } catch {
    return DEFAULT_WATCHLIST;
  }
}

interface MarketStats {
  total: number;
  volume: number;
  gainers: number;
  losers: number;
}

interface MarketStore {
  coins: Accessor<Coin[]>;
  ready: Accessor<boolean>;
  loading: Accessor<boolean>;
  refreshing: Accessor<boolean>;
  error: Accessor<Error | undefined>;
  connection: Accessor<ConnectionState>;
  lastTick: Accessor<number>;
  watchlist: Accessor<string[]>;
  watchlistCoins: Accessor<Coin[]>;
  stats: Accessor<MarketStats>;
  coinById: (id: string) => Coin | undefined;
  isWatched: (id: string) => boolean;
  toggleWatch: (id: string) => void;
  clearWatchlist: () => void;
  refresh: () => void;
  reconnect: () => void;
}

const MarketContext = createContext<MarketStore>();

export const MarketProvider: ParentComponent = (props) => {
  const toast = useToast();
  const [snapshot, { refetch }] = createResource(fetchTickers);
  const [coins, setCoins] = createStore<Coin[]>([]);
  const [connection, setConnection] = createSignal<ConnectionState>('connecting');
  const [lastTick, setLastTick] = createSignal(0);

  createEffect(() => {
    if (snapshot.error) return;
    const next = snapshot();
    if (!next?.length) return;
    batch(() => {
      setCoins(reconcile(next, { key: 'symbol' }));
      setLastTick(Date.now());
    });
  });

  let socket: WebSocket | null = null;
  let retryTimer: number | undefined;
  let attempts = 0;
  let disposed = false;

  const clearRetry = () => {
    if (retryTimer !== undefined) {
      window.clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  };

  const schedule = () => {
    if (disposed || navigator.onLine === false) return;
    const delay = Math.min(1000 * 2 ** attempts, 15_000);
    attempts += 1;
    retryTimer = window.setTimeout(() => {
      retryTimer = undefined;
      connect();
    }, delay);
  };

  const connect = () => {
    if (disposed) return;
    if (socket && socket.readyState <= WebSocket.OPEN) return;

    clearRetry();
    setConnection('connecting');

    try {
      socket = new WebSocket(TICKER_STREAM);
    } catch {
      setConnection('offline');
      schedule();
      return;
    }

    socket.onopen = () => {
      attempts = 0;
      setConnection('live');
    };

    socket.onmessage = (event) => {
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      const updates = parseTickerStream(payload);
      if (!updates.length) return;

      batch(() => {
        setCoins(
          produce((list) => {
            const index = new Map(list.map((coin, i) => [coin.symbol, i] as const));

            for (const tick of updates) {
              const at = index.get(tick.symbol);
              if (at === undefined) continue;

              const coin = list[at];
              coin.price = tick.close;
              coin.change = tick.open > 0 ? ((tick.close - tick.open) / tick.open) * 100 : coin.change;
              coin.open = tick.open || coin.open;
              coin.high = tick.high;
              coin.low = tick.low;
              coin.volume = tick.volume;
              coin.quoteVolume = tick.quoteVolume;
            }
          }),
        );
        setLastTick(Date.now());
      });
    };

    socket.onerror = () => socket?.close();

    socket.onclose = () => {
      socket = null;
      if (disposed) return;
      setConnection('offline');
      schedule();
    };
  };

  const reconnect = () => {
    attempts = 0;
    clearRetry();
    if (socket) {
      socket.onclose = null;
      socket.close();
      socket = null;
    }
    connect();
  };

  onMount(() => {
    connect();

    const onOnline = () => {
      reconnect();
      refetch();
    };
    const onOffline = () => {
      socket?.close();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    onCleanup(() => {
      disposed = true;
      clearRetry();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (socket) {
        socket.onclose = null;
        socket.close();
        socket = null;
      }
    });
  });

  const [watch, setWatch] = createStore<{ ids: string[] }>({ ids: loadWatchlist() });

  createEffect(
    on(
      () => watch.ids.slice(),
      (ids) => {
        try {
          localStorage.setItem(WATCHLIST_KEY, JSON.stringify(ids));
        } catch {
          /* storage can be unavailable in private browsing */
        }
      },
    ),
  );

  const isWatched = createSelector(
    () => watch.ids,
    (id: string, ids) => ids.includes(id),
  );

  const byId = createMemo(() => new Map(coins.map((coin) => [coin.id, coin] as const)));
  const coinById = (id: string) => byId().get(id);

  const setWatched = (id: string, watched: boolean, notify = true) => {
    if (watch.ids.includes(id) === watched) return;

    setWatch(
      'ids',
      produce((ids) => {
        const index = ids.indexOf(id);
        if (watched && index < 0) ids.push(id);
        if (!watched && index >= 0) ids.splice(index, 1);
      }),
    );

    if (!notify) return;
    const label = coinById(id)?.symbol ?? id.toUpperCase();
    toast.show({
      message: watched ? `${label} added to your watchlist` : `${label} removed from your watchlist`,
      tone: watched ? 'success' : 'info',
      action: { label: 'Undo', run: () => setWatched(id, !watched, false) },
    });
  };

  const toggleWatch = (id: string) => setWatched(id, !watch.ids.includes(id));

  const clearWatchlist = () => {
    const previous = watch.ids.slice();
    if (!previous.length) return;

    setWatch('ids', []);
    toast.show({
      message: `Cleared ${previous.length} saved ${previous.length === 1 ? 'asset' : 'assets'}`,
      tone: 'info',
      action: { label: 'Undo', run: () => setWatch('ids', previous) },
    });
  };

  const watchlistCoins = createMemo(() =>
    watch.ids
      .map((id) => byId().get(id))
      .filter((coin): coin is Coin => coin !== undefined),
  );

  const stats = createMemo<MarketStats>(() => {
    let volume = 0;
    let gainers = 0;
    let losers = 0;

    for (const coin of coins) {
      volume += coin.quoteVolume;
      if (coin.change > 0) gainers += 1;
      else if (coin.change < 0) losers += 1;
    }

    return {
      total: coins.length,
      volume,
      gainers,
      losers,
    };
  });

  const value: MarketStore = {
    coins: () => coins,
    ready: () => coins.length > 0 || Boolean(snapshot.error),
    loading: () => coins.length === 0 && !snapshot.error,
    refreshing: () => snapshot.loading,
    error: () => snapshot.error as Error | undefined,
    connection,
    lastTick,
    watchlist: () => watch.ids,
    watchlistCoins,
    stats,
    coinById,
    isWatched,
    toggleWatch,
    clearWatchlist,
    refresh: () => refetch(),
    reconnect,
  };

  return <MarketContext.Provider value={value}>{props.children}</MarketContext.Provider>;
};

export function useMarket(): MarketStore {
  const store = useContext(MarketContext);
  if (!store) throw new Error('useMarket must be used inside MarketProvider');
  return store;
}
