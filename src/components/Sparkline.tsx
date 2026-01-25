import { Component, createMemo, Show } from 'solid-js';

interface Props {
  data?: number[];
  up: boolean;
  height?: number;
  livePrice?: number; // Optional realtime price to append
}

const Sparkline: Component<Props> = (props) => {
  const chart = createMemo(() => {
    let d = props.data;
    if (!d || d.length < 2) return null;

    // Append live price if provided
    if (props.livePrice !== undefined) {
      d = [...d, props.livePrice];
    }

    const step = Math.max(1, Math.floor(d.length / 50));
    const sampled = d.filter((_, i) => i % step === 0 || i === d!.length - 1); // Always include last point
    const min = Math.min(...sampled), max = Math.max(...sampled), range = max - min || 1;

    const pts = sampled.map((v, i) => ({
      x: (i / (sampled.length - 1)) * 100,
      y: 100 - ((v - min) / range) * 100,
    }));

    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    return { path, area: `${path} L100,100 L0,100 Z` };
  });

  const color = () => props.up ? '#34d399' : '#f87171';

  return (
    <Show when={chart()} fallback={<div class="w-full h-full" />}>
      {(c) => (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="w-full h-full" style={{ height: props.height ? `${props.height}px` : '100%' }}>
          <defs>
            <linearGradient id={`sg-${props.up}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color={color()} stop-opacity="0.2" />
              <stop offset="100%" stop-color={color()} stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d={c().area} fill={`url(#sg-${props.up})`} />
          <path d={c().path} fill="none" stroke={color()} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        </svg>
      )}
    </Show>
  );
};

export default Sparkline;
