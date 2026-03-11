function scaleNum(n: number): { scaled: number; suffix: string } {
  if (n >= 1e12) return { scaled: n / 1e12, suffix: 'T' };
  if (n >= 1e9)  return { scaled: n / 1e9,  suffix: 'B' };
  if (n >= 1e6)  return { scaled: n / 1e6,  suffix: 'M' };
  if (n >= 1e3)  return { scaled: n / 1e3,  suffix: 'K' };
  return { scaled: n, suffix: '' };
}

// Format number as currency
export function fmt(n: number): string {
  if (!n || isNaN(n)) return '$0.00';
  if (n >= 1e3) {
    const { scaled, suffix } = scaleNum(n);
    return `$${scaled.toFixed(2)}${suffix}`;
  }
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(6)}`;
}

// Format percentage with sign
export function pct(n: number): string {
  if (!n || isNaN(n)) return '0.00%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// Compact number (no $ prefix)
export function compactNum(n: number): string {
  if (!n || isNaN(n)) return '0';
  if (n >= 1e3) {
    const { scaled, suffix } = scaleNum(n);
    return `${scaled.toFixed(2)}${suffix}`;
  }
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
