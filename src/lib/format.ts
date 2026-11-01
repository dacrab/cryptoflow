import type { RangeKey } from './types';

const compactFmt = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export function compact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0';
  return compactFmt.format(n);
}

export function usdCompact(n: number): string {
  return `$${compact(n)}`;
}

export function price(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '$0.00';
  if (n >= 1000) {
    return `$${n.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(8)}`;
}

export function qty(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0';
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  if (n >= 0.01) return n.toFixed(6);
  return n.toFixed(8);
}

export function pct(n: number): string {
  if (!Number.isFinite(n)) return '0.00%';
  const value = Math.abs(n) < 0.005 ? 0 : n;
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function time(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

export function chartDate(ts: number, range: RangeKey): string {
  const d = new Date(ts);
  if (range === '24h') {
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
  }
  return d.toLocaleDateString(
    'en-US',
    range === '1y'
      ? { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }
      : { month: 'short', day: 'numeric', timeZone: 'UTC' },
  );
}

/** Where `value` sits between `low` and `high`, clamped to 0–100. */
export function rangePosition(value: number, low: number, high: number): number {
  if (!Number.isFinite(value) || high <= low) return 50;
  return Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100));
}

export function rangeLabel(range: RangeKey): string {
  return { '24h': '24 hours', '7d': '7 days', '30d': '30 days', '90d': '90 days', '1y': '1 year' }[
    range
  ];
}
