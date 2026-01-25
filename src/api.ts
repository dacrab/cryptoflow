import type { Coin, CoinDetail, PricePoint } from './types';

const API = 'https://api.binance.com/api/v3';
const WS = 'wss://stream.binance.com:9443/ws';

const EXCLUDE = new Set(['USDC', 'BUSD', 'TUSD', 'FDUSD', 'DAI', 'USDD', 'USDP', 'WBTC', 'WBETH', 'STETH', 'BETH']);

// ============================================
// Cache System
// ============================================

const cache = new Map<string, { data: unknown; ts: number }>();

const getCache = <T>(key: string, ttl: number): T | null => {
  const entry = cache.get(key);
  return entry && Date.now() - entry.ts < ttl ? (entry.data as T) : null;
};

const setCache = (key: string, data: unknown) => cache.set(key, { data, ts: Date.now() });

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

// ============================================
// Shared Ticker Fetch (cached)
// ============================================

interface Ticker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
}

async function getAllTickers(): Promise<Ticker[]> {
  const cached = getCache<Ticker[]>('tickers', 10000);
  if (cached) return cached;
  
  const data = await fetchJson<Ticker[]>(`${API}/ticker/24hr`);
  setCache('tickers', data);
  return data;
}

// ============================================
// Centralized Realtime Manager
// ============================================

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface RealtimeData {
  price: number;
  change: number;
  volume: number;
  high: number;
  low: number;
  updatedAt: number;
}

type DataCallback = (symbol: string, data: RealtimeData) => void;
type StateCallback = (state: ConnectionState) => void;

class RealtimeManager {
  private ws: WebSocket | null = null;
  private symbols: string[] = [];
  private openPrices = new Map<string, number>();
  private dataCallbacks = new Set<DataCallback>();
  private stateCallbacks = new Set<StateCallback>();
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastMessage = 0;
  private updateBuffer = new Map<string, RealtimeData>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  
  private readonly FLUSH_INTERVAL = 100;
  private readonly MAX_RECONNECT_DELAY = 30000;
  private readonly HEARTBEAT_INTERVAL = 30000;

  subscribe(callback: DataCallback): () => void {
    this.dataCallbacks.add(callback);
    this.ensureConnected();
    return () => {
      this.dataCallbacks.delete(callback);
      this.checkDisconnect();
    };
  }

  subscribeState(callback: StateCallback): () => void {
    this.stateCallbacks.add(callback);
    callback(this.state);
    return () => {
      this.stateCallbacks.delete(callback);
      this.checkDisconnect();
    };
  }

  setOpenPrices(prices: Map<string, number>) {
    prices.forEach((v, k) => this.openPrices.set(k, v));
  }

  setSymbols(syms: string[]) {
    if (syms.join() !== this.symbols.join()) {
      this.symbols = syms;
      if (this.dataCallbacks.size > 0 || this.stateCallbacks.size > 0) {
        this.reconnectAttempts = 0;
        this.disconnect();
        this.connect();
      }
    }
  }

  reconnect() {
    this.reconnectAttempts = 0;
    this.disconnect();
    this.connect();
  }

  private ensureConnected() {
    if (this.ws?.readyState !== WebSocket.OPEN && this.ws?.readyState !== WebSocket.CONNECTING) {
      this.connect();
    }
  }

  private checkDisconnect() {
    if (this.dataCallbacks.size === 0 && this.stateCallbacks.size === 0) {
      this.disconnect();
    }
  }

  private setState(newState: ConnectionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.stateCallbacks.forEach(cb => cb(newState));
    }
  }

  private clearTimers() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
    if (this.flushTimer) { clearTimeout(this.flushTimer); this.flushTimer = null; }
  }

  private disconnect() {
    this.clearTimers();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
  }

  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
    if (!this.symbols.length) return;

    this.clearTimers();
    this.setState('connecting');

    const streams = this.symbols.slice(0, 100).map(s => `${s.toLowerCase()}usdt@ticker`).join('/');

    try {
      this.ws = new WebSocket(`${WS}/${streams}`);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.lastMessage = Date.now();
      this.heartbeatTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN && Date.now() - this.lastMessage > 10000) {
          this.ws.close();
        }
      }, this.HEARTBEAT_INTERVAL);
    };

    this.ws.onmessage = (e) => {
      this.lastMessage = Date.now();
      try {
        const d = JSON.parse(e.data);
        if (d.e !== '24hrTicker') return;

        const sym = d.s.replace('USDT', '');
        const price = parseFloat(d.c);
        const open = this.openPrices.get(sym) ?? parseFloat(d.o);

        const data: RealtimeData = {
          price,
          change: ((price - open) / open) * 100,
          volume: parseFloat(d.q),
          high: parseFloat(d.h),
          low: parseFloat(d.l),
          updatedAt: Date.now(),
        };

        this.updateBuffer.set(sym, data);
        this.scheduleFlush();
      } catch {}
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.clearTimers();
      this.setState('disconnected');
      if (this.dataCallbacks.size > 0 || this.stateCallbacks.size > 0) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => this.ws?.close();
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.MAX_RECONNECT_DELAY) * (0.75 + Math.random() * 0.5);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private flush() {
    if (this.updateBuffer.size === 0) return;
    this.updateBuffer.forEach((data, symbol) => {
      this.dataCallbacks.forEach(cb => cb(symbol, data));
    });
    this.updateBuffer.clear();
  }
}

export const realtime = new RealtimeManager();

// ============================================
// Coin Name Mapping
// ============================================

const NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB', SOL: 'Solana', XRP: 'XRP',
  DOGE: 'Dogecoin', ADA: 'Cardano', AVAX: 'Avalanche', SHIB: 'Shiba Inu', DOT: 'Polkadot',
  LINK: 'Chainlink', TRX: 'TRON', MATIC: 'Polygon', LTC: 'Litecoin', ATOM: 'Cosmos',
  UNI: 'Uniswap', XLM: 'Stellar', NEAR: 'NEAR', APT: 'Aptos', FIL: 'Filecoin',
  ARB: 'Arbitrum', OP: 'Optimism', INJ: 'Injective', SUI: 'Sui', IMX: 'Immutable',
  PEPE: 'Pepe', SEI: 'Sei', AAVE: 'Aave', GRT: 'The Graph', FTM: 'Fantom',
  ETC: 'Ethereum Classic', BCH: 'Bitcoin Cash', HBAR: 'Hedera', VET: 'VeChain',
  MKR: 'Maker', THETA: 'Theta', ALGO: 'Algorand', FLOW: 'Flow', SAND: 'The Sandbox',
  MANA: 'Decentraland', AXS: 'Axie Infinity', GALA: 'Gala', ENJ: 'Enjin', CHZ: 'Chiliz',
  CRV: 'Curve', LDO: 'Lido DAO', SNX: 'Synthetix', COMP: 'Compound', YFI: 'yearn.finance',
  SUSHI: 'SushiSwap', ZEC: 'Zcash', DASH: 'Dash', XMR: 'Monero', EOS: 'EOS',
  XTZ: 'Tezos', NEO: 'Neo', KAVA: 'Kava', ZIL: 'Zilliqa', ENS: 'ENS', BLUR: 'Blur',
  WLD: 'Worldcoin', FET: 'Fetch.ai', RNDR: 'Render', AGIX: 'SingularityNET', OCEAN: 'Ocean',
  TAO: 'Bittensor', TIA: 'Celestia', JUP: 'Jupiter', PYTH: 'Pyth Network', JTO: 'Jito',
  BONK: 'Bonk', WIF: 'dogwifhat', FLOKI: 'Floki', NOT: 'Notcoin', TON: 'Toncoin',
  ORDI: 'ORDI', STX: 'Stacks', KAS: 'Kaspa', RUNE: 'THORChain', FXS: 'Frax Share',
  GMX: 'GMX', DYDX: 'dYdX', PENDLE: 'Pendle', SSV: 'SSV Network', RPL: 'Rocket Pool',
  CFX: 'Conflux', ROSE: 'Oasis', ONE: 'Harmony', CELO: 'Celo', MINA: 'Mina',
  QNT: 'Quant', EGLD: 'MultiversX', ICP: 'Internet Computer',
};

const getName = (sym: string) => NAMES[sym] || sym;
const toId = (sym: string) => (NAMES[sym] || sym).toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Get symbol from coin ID
const idToSymbol = (id: string): string => {
  for (const [sym, name] of Object.entries(NAMES)) {
    if (name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === id) return sym;
  }
  return id.toUpperCase();
};

// ============================================
// API Functions
// ============================================

// Sparkline cache that persists across calls
const sparklineCache = new Map<string, number[]>();
let sparklineLoadPromise: Promise<void> | null = null;
let onSparklinesLoaded: (() => void) | null = null;

// Register callback for when sparklines finish loading
export function onSparklinesReady(callback: () => void) {
  onSparklinesLoaded = callback;
}

// Load sparklines in background (non-blocking)
async function loadSparklinesInBackground(syms: string[]) {
  // Fetch all sparklines in parallel (not sequential batches)
  const results = await Promise.allSettled(
    syms.map(sym => getSparkline(sym))
  );
  
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value) {
      sparklineCache.set(syms[i], result.value);
    }
  });
  
  // Notify that sparklines are ready
  if (onSparklinesLoaded) {
    onSparklinesLoaded();
  }
}

export async function getCoins(limit = 100): Promise<Coin[]> {
  const cached = getCache<Coin[]>(`coins_${limit}`, 30000);
  if (cached) {
    // If we have cached coins but missing sparklines, load them
    if (sparklineCache.size < limit && !sparklineLoadPromise) {
      const syms = cached.map(c => c.symbol.toUpperCase());
      sparklineLoadPromise = loadSparklinesInBackground(syms);
    }
    return cached;
  }

  const allTickers = await getAllTickers();

  const tickers = allTickers
    .filter(t => t.symbol.endsWith('USDT') && !EXCLUDE.has(t.symbol.replace('USDT', '')))
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, limit);

  const syms = tickers.map(t => t.symbol.replace('USDT', ''));
  realtime.setSymbols(syms);

  const opens = new Map<string, number>();
  tickers.forEach(t => {
    const sym = t.symbol.replace('USDT', '');
    const price = parseFloat(t.lastPrice);
    const pct = parseFloat(t.priceChangePercent);
    opens.set(sym, price / (1 + pct / 100));
  });
  realtime.setOpenPrices(opens);

  // Build coins immediately WITHOUT waiting for sparklines
  const coins: Coin[] = tickers.map((t, i) => {
    const sym = t.symbol.replace('USDT', '');
    const vol = parseFloat(t.quoteVolume);

    return {
      id: toId(sym),
      symbol: sym.toLowerCase(),
      name: getName(sym),
      image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym.toLowerCase()}.png`,
      current_price: parseFloat(t.lastPrice),
      price_change_percentage_24h: parseFloat(t.priceChangePercent),
      market_cap: vol * 10,
      market_cap_rank: i + 1,
      total_volume: vol,
      high_24h: parseFloat(t.highPrice),
      low_24h: parseFloat(t.lowPrice),
      sparkline_in_7d: sparklineCache.has(sym) ? { price: sparklineCache.get(sym)! } : undefined,
    };
  });

  setCache(`coins_${limit}`, coins);
  
  // Load sparklines in background AFTER returning coins
  if (!sparklineLoadPromise) {
    sparklineLoadPromise = loadSparklinesInBackground(syms).then(() => {
      sparklineLoadPromise = null;
      // Update cache with sparklines
      const updatedCoins = coins.map(c => ({
        ...c,
        sparkline_in_7d: sparklineCache.has(c.symbol.toUpperCase()) 
          ? { price: sparklineCache.get(c.symbol.toUpperCase())! } 
          : c.sparkline_in_7d,
      }));
      setCache(`coins_${limit}`, updatedCoins);
    });
  }
  
  return coins;
}

async function getSparkline(sym: string): Promise<number[] | null> {
  const cached = getCache<number[]>(`spark_${sym}`, 300000);
  if (cached) return cached;

  try {
    const data = await fetchJson<[number, string, string, string, string][]>(
      `${API}/klines?symbol=${sym}USDT&interval=4h&limit=42`
    );
    const prices = data.map(d => parseFloat(d[4]));
    setCache(`spark_${sym}`, prices);
    return prices;
  } catch {
    return null;
  }
}

export async function getCoin(id: string): Promise<CoinDetail> {
  const allTickers = await getAllTickers();
  const ticker = allTickers.find(t => t.symbol.endsWith('USDT') && toId(t.symbol.replace('USDT', '')) === id);
  if (!ticker) throw new Error('Not found');

  const sym = ticker.symbol.replace('USDT', '');
  const price = parseFloat(ticker.lastPrice);
  const change = parseFloat(ticker.priceChangePercent);
  const vol = parseFloat(ticker.quoteVolume);

  return {
    id,
    symbol: sym.toLowerCase(),
    name: getName(sym),
    image: { large: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym.toLowerCase()}.png`, small: '' },
    description: { en: '' },
    market_cap_rank: 0,
    market_data: {
      current_price: { usd: price },
      price_change_percentage_24h: change,
      price_change_percentage_7d: change * 1.2,
      price_change_percentage_30d: change * 2,
      market_cap: { usd: vol * 10 },
      total_volume: { usd: vol },
      high_24h: { usd: parseFloat(ticker.highPrice) },
      low_24h: { usd: parseFloat(ticker.lowPrice) },
      circulating_supply: 0,
      total_supply: null,
      ath: { usd: 0 },
      ath_change_percentage: { usd: 0 },
    },
  };
}

export async function getHistory(id: string, days: number): Promise<PricePoint[]> {
  const cached = getCache<PricePoint[]>(`hist_${id}_${days}`, days <= 1 ? 60000 : 300000);
  if (cached) return cached;

  const sym = idToSymbol(id);
  const [interval, limit] = days <= 1 ? ['5m', 288] : days <= 7 ? ['1h', 168] : days <= 30 ? ['4h', 180] : days <= 90 ? ['12h', 180] : ['1d', 365];

  const data = await fetchJson<[number, string, string, string, string][]>(
    `${API}/klines?symbol=${sym}USDT&interval=${interval}&limit=${limit}`
  );

  const points = data.map(d => ({ time: Math.floor(d[0] / 1000), price: parseFloat(d[4]) }));
  setCache(`hist_${id}_${days}`, points);
  return points;
}

export const prefetch = (id: string) => {
  [1, 7, 30, 90, 365].forEach((d, i) =>
    setTimeout(() => getHistory(id, d).catch(() => {}), i * 200)
  );
};

// ============================================
// Order Book & Trades
// ============================================

export interface OrderBookData {
  bids: [string, string][];
  asks: [string, string][];
  spread: number;
  spreadPercent: number;
  bidTotal: number;
  askTotal: number;
}

export interface Trade {
  id: number;
  price: number;
  qty: number;
  quoteQty: number;
  time: number;
  isBuy: boolean;
}

export async function getOrderBook(id: string, limit = 10): Promise<OrderBookData | null> {
  const sym = idToSymbol(id);
  const cached = getCache<OrderBookData>(`orderbook_${id}`, 5000);
  if (cached) return cached;

  try {
    const data = await fetchJson<{ bids: [string, string][]; asks: [string, string][] }>(
      `${API}/depth?symbol=${sym}USDT&limit=${limit}`
    );

    if (!data.bids?.length || !data.asks?.length) return null;

    const bestBid = parseFloat(data.bids[0]?.[0] || '0');
    const bestAsk = parseFloat(data.asks[0]?.[0] || '0');
    const spread = bestAsk - bestBid;
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    const bidTotal = data.bids.reduce((sum, [, qty]) => sum + parseFloat(qty), 0);
    const askTotal = data.asks.reduce((sum, [, qty]) => sum + parseFloat(qty), 0);

    const result: OrderBookData = { bids: data.bids, asks: data.asks, spread, spreadPercent, bidTotal, askTotal };
    setCache(`orderbook_${id}`, result);
    return result;
  } catch {
    return null;
  }
}

export async function getRecentTrades(id: string, limit = 20): Promise<Trade[]> {
  const sym = idToSymbol(id);
  const cached = getCache<Trade[]>(`trades_${id}`, 3000);
  if (cached) return cached;

  try {
    const data = await fetchJson<Array<{
      id: number;
      price: string;
      qty: string;
      quoteQty: string;
      time: number;
      isBuyerMaker: boolean;
    }>>(`${API}/trades?symbol=${sym}USDT&limit=${limit}`);

    const trades = data.map(t => ({
      id: t.id,
      price: parseFloat(t.price),
      qty: parseFloat(t.qty),
      quoteQty: parseFloat(t.quoteQty),
      time: t.time,
      isBuy: !t.isBuyerMaker,
    })).reverse();

    setCache(`trades_${id}`, trades);
    return trades;
  } catch {
    return [];
  }
}
