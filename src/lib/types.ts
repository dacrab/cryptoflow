export type ConnectionState = 'connecting' | 'live' | 'offline';

export type RangeKey = '24h' | '7d' | '30d' | '90d' | '1y';

export type SortKey = 'rank' | 'name' | 'price' | 'change' | 'volume';

export type Direction = 'asc' | 'desc';

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
  trades: number;
  weightedAvg: number;
  rank: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Level {
  price: number;
  qty: number;
  total: number;
}

export interface OrderBook {
  bids: Level[];
  asks: Level[];
  spread: number;
  spreadPct: number;
  bidTotal: number;
  askTotal: number;
}

export interface Trade {
  id: number;
  price: number;
  qty: number;
  quote: number;
  time: number;
  side: 'buy' | 'sell';
}
