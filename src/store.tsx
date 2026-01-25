import { createStore, produce, reconcile } from 'solid-js/store';
import { createResource, createEffect, createMemo, createContext, useContext, batch, on, onCleanup, createSignal, createSelector } from 'solid-js';
import { getCoins, realtime, onSparklinesReady, type ConnectionState, type RealtimeData } from './api';
import type { Coin, SortField, SortConfig } from './types';
import { getSortValue } from './utils';

interface State {
  search: string;
  sort: SortConfig;
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

  const [coinsStore, setCoinsStore] = createStore<{ list: Coin[]; byId: Record<string, number> }>({ 
    list: [], 
    byId: {}
  });
  
  const [connectionState, setConnectionState] = createSignal<ConnectionState>('disconnected');
  const [coinsResource, { refetch }] = createResource(() => getCoins(), { initialValue: [] });

  let symbolIndexMap = new Map<string, number>();

  createEffect(on(() => coinsResource(), (coins) => {
    if (coins.length) {
      const byId: Record<string, number> = {};
      symbolIndexMap = new Map();
      coins.forEach((c, i) => {
        byId[c.id] = i;
        symbolIndexMap.set(c.symbol.toUpperCase(), i);
      });
      
      batch(() => {
        setCoinsStore('list', reconcile(coins));
        setCoinsStore('byId', byId);
      });
    }
  }));

  // Refetch when sparklines finish loading in background
  onSparklinesReady(() => {
    refetch();
  });

  const unsubState = realtime.subscribeState(setConnectionState);
  const unsub = realtime.subscribe((symbol: string, data: RealtimeData) => {
    const i = symbolIndexMap.get(symbol);
    if (i !== undefined) {
      batch(() => {
        setCoinsStore('list', i, 'current_price', data.price);
        setCoinsStore('list', i, 'price_change_percentage_24h', data.change);
        setCoinsStore('list', i, 'total_volume', data.volume);
        setCoinsStore('list', i, 'high_24h', data.high);
        setCoinsStore('list', i, 'low_24h', data.low);
      });
    }
  });
  onCleanup(() => { unsubState(); unsub(); });

  createEffect(on(() => state.watchlist, (list) => localStorage.setItem('watchlist', JSON.stringify(list)), { defer: true }));
  createEffect(on(() => state.sort, (sort) => localStorage.setItem('sort', JSON.stringify(sort)), { defer: true }));

  const isWatchedSelector = createSelector(
    () => state.watchlist,
    (id: string, watchlist) => watchlist.includes(id)
  );

  // Actions
  const setSearch = (s: string) => setState('search', s);
  const clearSearch = () => setState('search', '');
  const toggleWatchlistOnly = () => setState('watchlistOnly', !state.watchlistOnly);
  const setWatchlistOnly = (v: boolean) => setState('watchlistOnly', v);

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

  // Filtered list
  const filtered = createMemo(() => {
    const list = coinsStore.list;
    const q = state.search.toLowerCase().trim();
    const watchlistOnly = state.watchlistOnly;
    const watchlist = state.watchlist;
    
    if (!q && !watchlistOnly) return list;
    
    return list.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.symbol.includes(q)) return false;
      if (watchlistOnly && !watchlist.includes(c.id)) return false;
      return true;
    });
  });

  // Sorted list with watched coins first
  const sorted = createMemo(() => {
    const list = filtered();
    const { field, direction } = state.sort;
    const watchlist = state.watchlist;
    const m = direction === 'asc' ? 1 : -1;
    
    return [...list].sort((a, b) => {
      const aWatched = watchlist.includes(a.id);
      const bWatched = watchlist.includes(b.id);
      if (aWatched && !bWatched) return -1;
      if (!aWatched && bWatched) return 1;
      return (getSortValue(a, field) - getSortValue(b, field)) * m;
    });
  });

  // Watched coins using index lookup
  const watched = createMemo(() => {
    const watchlist = state.watchlist;
    const byId = coinsStore.byId;
    const list = coinsStore.list;
    
    return watchlist
      .map(id => byId[id] !== undefined ? list[byId[id]] : undefined)
      .filter((c): c is Coin => c !== undefined);
  });

  // Single-pass stats calculation
  const stats = createMemo(() => {
    const list = coinsStore.list;
    let gainers = 0, losers = 0;
    
    for (const c of list) {
      if (c.price_change_percentage_24h > 0) gainers++;
      else if (c.price_change_percentage_24h < 0) losers++;
    }
    
    return {
      total: list.length,
      filtered: filtered().length,
      watched: state.watchlist.length,
      gainers,
      losers,
    };
  });

  const getCoinById = (id: string) => {
    const idx = coinsStore.byId[id];
    return idx !== undefined ? coinsStore.list[idx] : undefined;
  };

  return {
    state,
    coins: () => coinsStore.list,
    loading: () => coinsResource.loading,
    error: () => coinsResource.error,
    connectionState,
    reconnect: realtime.reconnect.bind(realtime),
    filtered, sorted, watched, stats,
    getCoinById,
    isWatched: isWatchedSelector,
    setSearch, clearSearch, setSort, toggleWatch, toggleWatchlistOnly, setWatchlistOnly, refetch,
  };
}

export type Store = ReturnType<typeof createAppStore>;

const StoreContext = createContext<Store>();

export function StoreProvider(props: { children: any }) {
  return <StoreContext.Provider value={createAppStore()}>{props.children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
