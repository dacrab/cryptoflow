import { Component, createSignal, createResource, createMemo, createEffect, on, Show, For, Switch, Match } from 'solid-js';
import { getHistory } from '../api';
import { fmt } from '../utils';
import { ChartSkeleton, LiveIndicator } from './ui';

const RANGES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

interface Props {
  coinId: string;
  symbol?: string;
  livePrice?: number; // Passed from parent (via store's centralized realtime)
}

const PriceChart: Component<Props> = (props) => {
  const [days, setDays] = createSignal(7);
  const [hover, setHover] = createSignal<number | null>(null);
  const [points, setPoints] = createSignal<{ x: number; y: number; price: number; date: string }[]>([]);

  const [data] = createResource(() => ({ id: props.coinId, days: days() }), (p) => getHistory(p.id, p.days));

  // Process data - uses livePrice from props (centralized store)
  createEffect(on([() => data(), () => props.livePrice], ([d, livePrice]) => {
    if (!d || d.length < 2) return;

    let prices = [...d];

    // Always add live price point if available
    if (livePrice !== undefined) {
      const last = prices[prices.length - 1];
      const now = Math.floor(Date.now() / 1000);
      if (now - last.time > 60) {
        prices = [...prices, { time: now, price: livePrice }];
      } else {
        prices = [...prices.slice(0, -1), { time: now, price: livePrice }];
      }
    }

    const vals = prices.map(p => p.price);
    const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
    const n = 80;

    setPoints(Array.from({ length: n }, (_, i) => {
      const idx = (i / (n - 1)) * (prices.length - 1);
      const lo = Math.floor(idx), hi = Math.min(lo + 1, prices.length - 1), t = idx - lo;
      const price = prices[lo].price * (1 - t) + prices[hi].price * t;
      const time = prices[lo].time * (1 - t) + prices[hi].time * t;
      return {
        x: (i / (n - 1)) * 100,
        y: 100 - ((price - min) / range) * 85,
        price,
        date: new Date(time * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: days() <= 1 ? 'numeric' : undefined }),
      };
    }));
  }));

  const path = createMemo(() => points().map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
  const area = createMemo(() => path() ? `${path()} L100,100 L0,100 Z` : '');

  const first = () => points()[0]?.price ?? 0;
  const last = () => props.livePrice ?? points().at(-1)?.price ?? 0;
  const up = () => last() >= first();
  const change = () => first() ? ((last() - first()) / first()) * 100 : 0;
  const color = () => up() ? '#10b981' : '#ef4444';

  const hovered = () => hover() !== null ? points()[hover()!] : null;
  const showPrice = () => hovered()?.price ?? last();
  const showDate = () => hovered()?.date ?? (props.livePrice !== undefined ? 'Now' : `vs ${RANGES.find(r => r.days === days())?.label} ago`);

  const onMove = (e: MouseEvent) => {
    const pts = points();
    if (pts.length === 0) return;
    const rect = (e.target as SVGElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setHover(pts.reduce((best, p, i) => Math.abs(p.x - x) < Math.abs(pts[best].x - x) ? i : best, 0));
  };
  
  const maxPrice = () => {
    const pts = points();
    return pts.length > 0 ? Math.max(...pts.map(p => p.price)) : 0;
  };
  
  const minPrice = () => {
    const pts = points();
    return pts.length > 0 ? Math.min(...pts.map(p => p.price)) : 0;
  };

  return (
    <Switch>
      <Match when={data.loading && !points().length}><ChartSkeleton /></Match>
      <Match when={data.error}><div class="h-48 flex items-center justify-center text-red-400">Failed to load</div></Match>
      <Match when={points().length > 0}>
        <div class="select-none">
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="text-3xl font-mono font-semibold">{fmt(showPrice())}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class={`text-sm font-mono ${up() ? 'text-emerald-500' : 'text-red-500'}`}>{up() ? '↑' : '↓'} {Math.abs(change()).toFixed(2)}%</span>
                <span class="text-sm text-zinc-600">{showDate()}</span>
                <LiveIndicator show={props.livePrice !== undefined} />
              </div>
            </div>
            <div class="flex gap-0.5 bg-white/5 rounded-lg p-0.5">
              <For each={RANGES}>
                {(r) => (
                  <button onClick={() => setDays(r.days)} class={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${days() === r.days ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {r.label}
                  </button>
                )}
              </For>
            </div>
          </div>

          <div class="relative h-48">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full cursor-crosshair" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
              <defs>
                <linearGradient id="g-up" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity="0.2" /><stop offset="100%" stop-color="#10b981" stop-opacity="0" /></linearGradient>
                <linearGradient id="g-down" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ef4444" stop-opacity="0.2" /><stop offset="100%" stop-color="#ef4444" stop-opacity="0" /></linearGradient>
              </defs>
              <g stroke="white" stroke-opacity="0.03"><line x1="0" y1="25" x2="100" y2="25" /><line x1="0" y1="50" x2="100" y2="50" /><line x1="0" y1="75" x2="100" y2="75" /></g>
              <path d={area()} fill={up() ? 'url(#g-up)' : 'url(#g-down)'} />
              <path d={path()} fill="none" stroke={color()} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
              <Show when={hovered()}>{(p) => <line x1={p().x} y1="0" x2={p().x} y2="100" stroke="white" stroke-opacity="0.15" stroke-dasharray="2,2" vector-effect="non-scaling-stroke" />}</Show>
            </svg>
            <Show when={hovered()}>
              {(p) => (
                <div class="absolute pointer-events-none transition-all duration-75" style={{ left: `${p().x}%`, top: `${p().y}%`, transform: 'translate(-50%,-50%)' }}>
                  <div class="w-3 h-3 rounded-full border-2" style={{ background: '#09090b', 'border-color': color(), 'box-shadow': `0 0 10px ${color()}` }} />
                </div>
              )}
            </Show>
            <div class="absolute right-0 top-2 text-[10px] font-mono text-zinc-600">{fmt(maxPrice())}</div>
            <div class="absolute right-0 bottom-2 text-[10px] font-mono text-zinc-600">{fmt(minPrice())}</div>
          </div>
        </div>
      </Match>
    </Switch>
  );
};

export default PriceChart;
