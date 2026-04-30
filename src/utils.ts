function scaleNum(n: number): { scaled: number; suffix: string } {
  if (n >= 1e12) return { scaled: n / 1e12, suffix: 'T' };
  if (n >= 1e9)  return { scaled: n / 1e9,  suffix: 'B' };
  if (n >= 1e6)  return { scaled: n / 1e6,  suffix: 'M' };
  if (n >= 1e3)  return { scaled: n / 1e3,  suffix: 'K' };
  return { scaled: n, suffix: '' };
}

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

export function compactNum(n: number): string {
  if (!n || isNaN(n)) return '0';
  if (n >= 1e3) {
    const { scaled, suffix } = scaleNum(n);
    return `${scaled.toFixed(2)}${suffix}`;
  }
  return n.toFixed(2);
}
