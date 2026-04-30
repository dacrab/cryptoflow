import { createStore, produce } from 'solid-js/store';
import { createResource, createEffect, createMemo, createContext, useContext, on, onCleanup, createSignal } from 'solid-js';
import { getCoins, realtime, onSparklinesReady, type ConnectionState, type RealtimeData } from './api';
import type { Coin, SortField, SortDirection } from './types';

interface State {
  search: string;
  sort: { field: SortField; direction: SortDirection };
  watchlist: string[];
  watchlistOnly: boolean;
}

const load = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

function createAppStore() {
  const [state, setState] = createStore<State>({
    search: '',
    sort: load('sort', { field: 'market_cap', direction: 'desc' }),
    watchlist: load('watchlist', ['bitcoin', 'ethereum']),
    watchlistOnly: false,
  });

  const [coins, setCoins] = createStore<Coin[]>([]);
  const [connectionState, setConnectionState] = createSignal<ConnectionState>('disconnected');
  const [coinsResource, { refetch }] = createResource(() => getCoins(), { initialValue: [] });

  createEffect(on(() => coinsResource(), (newCoins) => {
    if (newCoins.length) setCoins(newCoins);
  }));

  onSparklinesReady((sparklines: Map<string, number[]>) => {
    coins.forEach((coin, i) => {
      const data = sparklines.get(coin.symbol.toUpperCase());
      if (data) setCoins(i, 'sparkline_in_7d', { price: data });
    });
  });

  const unsubState = realtime.subscribeState(setConnectionState);
  const unsub = realtime.subscribe((symbol: string, data: RealtimeData) => {
    const i = coins.findIndex(c => c.symbol.toUpperCase() === symbol);
    if (i >= 0) {
      setCoins(i, {
        current_price: data.price,
        price_change_percentage_24h: data.change,
        total_volume: data.volume,
        high_24h: data.high,
        low_24h: data.low,
      });
    }
  });
  onCleanup(() => { unsubState(); unsub(); });

  createEffect(on(() => state.watchlist, (list) => localStorage.setItem('watchlist', JSON.stringify(list)), { defer: true }));
  createEffect(on(() => state.sort, (sort) => localStorage.setItem('sort', JSON.stringify(sort)), { defer: true }));

  const isWatched = (id: string) => state.watchlist.includes(id);

  const setSearch = (s: string) => setState('search', s);
  const clearSearch = () => setState('search', '');
  const toggleWatchlistOnly = () => setState('watchlistOnly', !state.watchlistOnly);

  const setSort = (field: SortField) => {
    setState('sort', produce((s) => {
      if (s.field === field) s.direction = s.direction === 'asc' ? 'desc' : 'asc';
      else { s.field = field; s.direction = 'desc'; }
    }));
  };

  const toggleWatch = (id: string) => {
    setState('watchlist', produce((list) => {
      const i = list.indexOf(id);
      i >= 0 ? list.splice(i, 1) : list.push(id);
    }));
  };

  const filtered = createMemo(() => {
    const q = state.search.toLowerCase().trim();
    if (!q && !state.watchlistOnly) return coins;
    
    return coins.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.symbol.includes(q)) return false;
      if (state.watchlistOnly && !state.watchlist.includes(c.id)) return false;
      return true;
    });
  });

  const sorted = createMemo(() => {
    const list = filtered();
    const { field, direction } = state.sort;
    const watchSet = new Set(state.watchlist);
    const m = direction === 'asc' ? 1 : -1;
    
    const getValue = (c: Coin) => {
      if (field === 'price') return c.current_price;
      if (field === 'change_24h') return c.price_change_percentage_24h;
      if (field === 'volume') return c.total_volume;
      return c.market_cap;
    };
    
    return [...list].sort((a, b) => {
      const aW = watchSet.has(a.id);
      const bW = watchSet.has(b.id);
      if (aW && !bW) return -1;
      if (!aW && bW) return 1;
      return (getValue(a) - getValue(b)) * m;
    });
  });

  const watched = createMemo(() => {
    return state.watchlist
      .map(id => coins.find(c => c.id === id))
      .filter((c): c is Coin => c !== undefined);
  });

  const stats = createMemo(() => {
    let gainers = 0, losers = 0;
    for (const c of coins) {
      if (c.price_change_percentage_24h > 0) gainers++;
      else if (c.price_change_percentage_24h < 0) losers++;
    }
    return {
      total: coins.length,
      filtered: filtered().length,
      watched: state.watchlist.length,
      gainers,
      losers,
    };
  });

  const getCoinById = (id: string) => coins.find(c => c.id === id);

  return {
    state,
    coins: () => coins,
    loading: () => coinsResource.loading,
    error: () => coinsResource.error,
    connectionState,
    reconnect: realtime.reconnect.bind(realtime),
    filtered, sorted, watched, stats,
    getCoinById,
    isWatched,
    setSearch, clearSearch, setSort, toggleWatch, toggleWatchlistOnly, refetch,
  };
}

export type Store = ReturnType<typeof createAppStore>;

const StoreContext = createContext<Store>();

export function StoreProvider(props: { children: import('solid-js').JSX.Element }) {
  return <StoreContext.Provider value={createAppStore()}>{props.children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
