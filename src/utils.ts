// Format number as currency
export function fmt(n: number): string {
  if (!n || isNaN(n)) return '$0.00';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

// Format percentage with sign
export function pct(n: number): string {
  if (!n || isNaN(n)) return '0.00%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// Compact number (no $ prefix) - uses same logic as fmt
export function compactNum(n: number): string {
  if (!n || isNaN(n)) return '0';
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(2);
}

// Get sort value from coin by field name
export function getSortValue(coin: { current_price: number; price_change_percentage_24h: number; total_volume: number; market_cap: number }, field: string): number {
  switch (field) {
    case 'price': return coin.current_price;
    case 'change_24h': return coin.price_change_percentage_24h;
    case 'volume': return coin.total_volume;
    default: return coin.market_cap;
  }
}
