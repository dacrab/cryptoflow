import {
  Component,
  For,
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  on,
} from 'solid-js';
import { revalidate } from '@solidjs/router';
import { getKlines } from '../lib/api';
import { chartDate, price as formatPrice, rangeLabel } from '../lib/format';
import { Button, Change, Panel, Segmented, Skeleton } from './ui';
import { Icon } from './Icon';
import type { RangeKey } from '../lib/types';

const RANGES = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
] as const;

const VIEW_W = 1000;
const VIEW_H = 340;
const PLOT_TOP = 8;
const PLOT_BOTTOM = 236;
const VOL_TOP = 262;
const VOL_BOTTOM = 322;

const UP = '#3fb950';
const DOWN = '#f85149';

interface PriceChartProps {
  symbol: string;
  live: number;
}

export const PriceChart: Component<PriceChartProps> = (props) => {
  const [range, setRange] = createSignal<RangeKey>('7d');
  const [hover, setHover] = createSignal<number | null>(null);
  const gradientId = `chart-${createUniqueId()}`;

  const [candles, { refetch }] = createResource(
    () => ({ symbol: props.symbol, range: range() }),
    (source) => getKlines(source.symbol, source.range),
  );

  const volumeBars = createMemo(() => {
    if (candles.error) return [];
    const data = candles();
    if (!data?.length) return [];

    const maxVolume = Math.max(...data.map((candle) => candle.volume)) || 1;
    const slot = VIEW_W / data.length;
    const width = slot * 0.62;

    return data.map((candle, index) => {
      const height = (candle.volume / maxVolume) * (VOL_BOTTOM - VOL_TOP);
      return {
        x: index * slot + (slot - width) / 2,
        y: VOL_BOTTOM - height,
        height,
        width,
      };
    });
  });

  const model = createMemo(() => {
    if (candles.error) return null;
    const data = candles();
    if (!data || data.length < 2) return null;

    const last = props.live > 0 ? props.live : data[data.length - 1].close;
    const first = data[0].close;
    const low = Math.min(...data.map((candle) => candle.low), last);
    const high = Math.max(...data.map((candle) => candle.high), last);
    const padding = (high - low) * 0.08 || high * 0.01 || 1;
    const floor = low - padding;
    const ceiling = high + padding;
    const span = ceiling - floor || 1;

    const x = (index: number) => (index / (data.length - 1)) * VIEW_W;
    const y = (value: number) =>
      PLOT_BOTTOM - ((value - floor) / span) * (PLOT_BOTTOM - PLOT_TOP);

    const points = data.map((candle, index) => {
      const close = index === data.length - 1 ? last : candle.close;
      return { x: x(index), y: y(close), close, time: candle.time };
    });

    const line = points
      .map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' ');
    const area = `${line} L${VIEW_W},${PLOT_BOTTOM} L0,${PLOT_BOTTOM} Z`;

    return {
      points,
      line,
      area,
      low,
      high,
      first,
      last,
      timeStart: data[0].time,
      timeEnd: data[data.length - 1].time,
      up: last >= first,
      change: first ? ((last - first) / first) * 100 : 0,
      absolute: last - first,
    };
  });

  const hovered = () => {
    const index = hover();
    return index === null ? null : model()?.points[index] ?? null;
  };

  const display = createMemo(() => {
    const chart = model();
    if (!chart) return null;
    const value = hovered()?.close ?? chart.last;
    const absolute = chart.first ? value - chart.first : 0;
    return {
      value,
      absolute,
      change: chart.first ? (absolute / chart.first) * 100 : 0,
    };
  });

  const onPointerMove = (event: PointerEvent) => {
    const chart = model();
    if (!chart) return;

    const target = event.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (chart.points.length - 1));
    setHover(Math.min(chart.points.length - 1, Math.max(0, index)));
  };

  createEffect(
    on(range, () => {
      setHover(null);
    }),
  );

  const color = () => (model()?.up ? UP : DOWN);

  const retry = async () => {
    await revalidate(getKlines.key);
    refetch();
  };

  return (
    <Panel class="relative overflow-hidden">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div class="flex items-baseline gap-2 text-[11px] text-dim">
            <span>Price</span>
            <span>·</span>
            <span>{rangeLabel(range())}</span>
            <span>·</span>
            <span class="flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-up" />
              Live
            </span>
            <Show when={candles.loading && model()}>
              <span class="text-dim/70">updating</span>
            </Show>
          </div>

          <div class="mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span class="font-mono text-[24px] tabular-nums text-fg">
              {formatPrice(display()?.value ?? props.live)}
            </span>
            <Show when={display()}>
              {(chart) => (
                <>
                  <Change value={chart().change} size="lg" />
                  <span class="font-mono text-[11px] text-dim">
                    {chart().absolute >= 0 ? '+' : '-'}
                    {formatPrice(Math.abs(chart().absolute))}
                  </span>
                </>
              )}
            </Show>
          </div>
          <div class="mt-1 text-[11px] text-dim">
            {hovered()
              ? chartDate(hovered()!.time, range())
              : `vs ${rangeLabel(range())} ago`}
          </div>
        </div>

        <Segmented
          value={range()}
          options={RANGES}
          onChange={(value) => setRange(value as RangeKey)}
        />
      </div>

      <Show
        when={model()}
        fallback={
          <Show
            when={candles.error}
            fallback={
              <div class="mt-4 space-y-3">
                <Skeleton class="h-[260px] w-full sm:h-[320px]" />
                <div class="flex justify-between">
                  <Skeleton class="h-2 w-16" />
                  <Skeleton class="h-2 w-16" />
                </div>
              </div>
            }
          >
            <div class="mt-4 flex h-[260px] flex-col items-center justify-center gap-2 rounded-md border border-line sm:h-[320px]">
              <Icon name="alert" size={18} class="text-down" />
              <p class="text-[13px] text-muted">Could not load price history.</p>
              <Button variant="secondary" size="sm" onClick={retry}>
                Try again
              </Button>
            </div>
          </Show>
        }
      >
        {(chart) => (
          <div class="relative mt-4 h-[260px] sm:h-[320px]">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              preserveAspectRatio="none"
              class="h-full w-full touch-pan-y select-none"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setHover(null)}
              role="img"
              aria-label={`${props.symbol} price chart for ${rangeLabel(range())}`}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color={color()} stop-opacity="0.12" />
                  <stop offset="100%" stop-color={color()} stop-opacity="0" />
                </linearGradient>
              </defs>

              <For each={[0.2, 0.4, 0.6, 0.8]}>
                {(ratio) => (
                  <line
                    x1="0"
                    y1={PLOT_TOP + (PLOT_BOTTOM - PLOT_TOP) * ratio}
                    x2={VIEW_W}
                    y2={PLOT_TOP + (PLOT_BOTTOM - PLOT_TOP) * ratio}
                    stroke="rgba(255,255,255,0.045)"
                    stroke-width="1"
                    vector-effect="non-scaling-stroke"
                  />
                )}
              </For>

              <For each={volumeBars()}>
                {(bar) => (
                  <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={bar.height}
                    fill={color()}
                    opacity="0.12"
                  />
                )}
              </For>

              <path d={chart().area} fill={`url(#${gradientId})`} />
              <path
                d={chart().line}
                fill="none"
                stroke={color()}
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                vector-effect="non-scaling-stroke"
              />
            </svg>

            <span class="pointer-events-none absolute right-1 top-0 rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-dim">
              {formatPrice(chart().high)}
            </span>
            <span class="pointer-events-none absolute right-1 top-[64%] rounded bg-ink/80 px-1.5 py-0.5 font-mono text-[10px] text-dim">
              {formatPrice(chart().low)}
            </span>

            <Show when={hovered()}>
              {(point) => (
                <>
                  <div
                    class="pointer-events-none absolute inset-y-0 w-px border-l border-dashed border-white/15"
                    style={{ left: `${(point().x / VIEW_W) * 100}%` }}
                  />
                  <div
                    class="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink"
                    style={{
                      left: `${(point().x / VIEW_W) * 100}%`,
                      top: `${(point().y / VIEW_H) * 100}%`,
                      background: color(),
                    }}
                  />
                  <div
                    class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-md border border-line bg-[#15171a] px-2 py-1"
                    style={{
                      left: `${Math.min(88, Math.max(12, (point().x / VIEW_W) * 100))}%`,
                      top: `${(point().y / VIEW_H) * 100}%`,
                    }}
                  >
                    <div class="font-mono text-[11px] tabular-nums text-fg">
                      {formatPrice(point().close)}
                    </div>
                    <div class="mt-0.5 whitespace-nowrap text-[10px] text-dim">
                      {chartDate(point().time, range())}
                    </div>
                  </div>
                </>
              )}
            </Show>
          </div>
        )}
      </Show>

      <Show when={model()}>
        {(chart) => (
          <div class="mt-2 flex items-center justify-between font-mono text-[10px] text-dim">
            <span>{chartDate(chart().timeStart, range())}</span>
            <span>{chartDate(chart().timeEnd, range())}</span>
          </div>
        )}
      </Show>
    </Panel>
  );
};
