import { query } from '@solidjs/router';
import { assetName } from './assets';
import type { Candle, Coin, Level, OrderBook, RangeKey, Trade } from './types';

const API = 'https://api.binance.com/api/v3';

export const TICKER_STREAM = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';

const STABLES = new Set([
  'USDC', 'FDUSD', 'TUSD', 'BUSD', 'DAI', 'USDP', 'USDD', 'USDE', 'USDS', 'USD1',
  'EUR', 'EURI', 'GBP', 'AEUR', 'XAUT', 'PAXG',
  'WBTC', 'WBETH', 'STETH', 'BETH', 'CBETH', 'RETH', 'WSTETH',
]);

const RANGES: Record<RangeKey, { interval: string; limit: number }> = {
  '24h': { interval: '5m', limit: 288 },
  '7d': { interval: '1h', limit: 168 },
  '30d': { interval: '4h', limit: 180 },
  '90d': { interval: '12h', limit: 180 },
  '1y': { interval: '1d', limit: 365 },
};

interface RawTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  weightedAvgPrice: string;
  count: number;
}

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`);
  } catch {
    throw new Error('Could not reach Binance. Check your connection and try again.');
  }

  if (!res.ok) throw new Error(`Binance request failed (${res.status})`);
  return res.json() as Promise<T>;
}

export async function fetchTickers(): Promise<Coin[]> {
  const rows = await request<RawTicker[]>('/ticker/24hr');

  return rows
    .filter((row) => row.symbol.endsWith('USDT'))
    .map((row) => {
      const symbol = row.symbol.slice(0, -4);
      return {
        id: symbol.toLowerCase(),
        symbol,
        name: assetName(symbol),
        price: Number(row.lastPrice),
        change: Number(row.priceChangePercent),
        open: Number(row.openPrice),
        high: Number(row.highPrice),
        low: Number(row.lowPrice),
        volume: Number(row.volume),
        quoteVolume: Number(row.quoteVolume),
        trades: row.count,
        weightedAvg: Number(row.weightedAvgPrice),
        rank: 0,
      };
    })
    .filter((coin) => coin.price > 0 && coin.quoteVolume > 0 && !STABLES.has(coin.symbol))
    .sort((a, b) => b.quoteVolume - a.quoteVolume)
    .slice(0, 100)
    .map((coin, index) => ({ ...coin, rank: index + 1 }));
}

async function fetchKlines(base: string, range: RangeKey): Promise<Candle[]> {
  const { interval, limit } = RANGES[range];
  const rows = await request<[number, string, string, string, string, string][]>(
    `/klines?symbol=${base}USDT&interval=${interval}&limit=${limit}`,
  );

  return rows.map((row) => ({
    time: row[0],
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5]),
  }));
}

export const getKlines = query(fetchKlines, 'klines');

export async function fetchDepth(base: string, limit = 12): Promise<OrderBook> {
  const raw = await request<{ bids: [string, string][]; asks: [string, string][] }>(
    `/depth?symbol=${base}USDT&limit=${limit}`,
  );

  const toLevels = (rows: [string, string][]): Level[] => {
    let total = 0;
    return rows.map(([price, qty]) => {
      const levelQty = Number(qty);
      total += levelQty;
      return { price: Number(price), qty: levelQty, total };
    });
  };

  const bids = toLevels(raw.bids);
  const asks = toLevels(raw.asks);
  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestAsk - bestBid;

  return {
    bids,
    asks,
    spread,
    spreadPct: bestBid > 0 ? (spread / bestBid) * 100 : 0,
    bidTotal: bids.at(-1)?.total ?? 0,
    askTotal: asks.at(-1)?.total ?? 0,
  };
}

export async function fetchTrades(base: string, limit = 20): Promise<Trade[]> {
  const rows = await request<
    { id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }[]
  >(`/trades?symbol=${base}USDT&limit=${limit}`);

  return rows
    .map((row) => ({
      id: row.id,
      price: Number(row.price),
      qty: Number(row.qty),
      quote: Number(row.quoteQty),
      time: row.time,
      side: row.isBuyerMaker ? ('sell' as const) : ('buy' as const),
    }))
    .reverse();
}

interface MiniTicker {
  symbol: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
}

export function parseTickerStream(payload: unknown): MiniTicker[] {
  const rows = Array.isArray(payload) ? payload : [payload];
  const parsed: MiniTicker[] = [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const item = row as Record<string, unknown>;
    if (item.e !== '24hrMiniTicker' || typeof item.s !== 'string') continue;
    if (!item.s.endsWith('USDT')) continue;

    const symbol = item.s.slice(0, -4);
    const close = Number(item.c);
    const open = Number(item.o);
    if (!Number.isFinite(close) || !Number.isFinite(open)) continue;

    parsed.push({
      symbol,
      close,
      open,
      high: Number(item.h),
      low: Number(item.l),
      volume: Number(item.v),
      quoteVolume: Number(item.q),
    });
  }

  return parsed;
}
