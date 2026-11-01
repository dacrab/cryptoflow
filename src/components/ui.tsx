import {
  Component,
  For,
  JSX,
  ParentComponent,
  Show,
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js';
import { Icon, type IconName } from './Icon';
import { pct, price as formatPrice } from '../lib/format';
import type { ConnectionState } from '../lib/types';

export const Panel: ParentComponent<{ class?: string; flush?: boolean }> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'flush', 'children']);

  return (
    <div {...rest} class={`panel ${local.flush ? '' : 'p-5'} ${local.class ?? ''}`}>
      {local.children}
    </div>
  );
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'icon';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-fg text-ink hover:bg-fg/90',
  secondary: 'border border-line bg-panel text-fg hover:border-[#35383d] hover:bg-[#17191c]',
  ghost: 'text-muted hover:bg-white/[0.05] hover:text-fg',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12px]',
  md: 'h-9 px-3.5 text-[13px]',
  icon: 'h-8 w-8',
};

export const Button: ParentComponent<ButtonProps> = (props) => {
  const merged = mergeProps({ type: 'button', variant: 'secondary', size: 'md' } as const, props);
  const [local, rest] = splitProps(merged, ['variant', 'size', 'class', 'children']);

  return (
    <button
      {...rest}
      class={`inline-flex select-none items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 ${BUTTON_VARIANTS[local.variant]} ${BUTTON_SIZES[local.size]} ${local.class ?? ''}`}
    >
      {local.children}
    </button>
  );
};

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  class?: string;
}

export function Segmented<T extends string>(props: SegmentedProps<T>) {
  const isActive = createSelector(() => props.value);

  return (
    <div
      class={`inline-flex items-center rounded-md border border-line bg-panel p-0.5 ${props.class ?? ''}`}
      role="tablist"
    >
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            role="tab"
            aria-selected={isActive(option.value)}
            onClick={() => props.onChange(option.value)}
            classList={{
              'bg-[#212429] text-fg': isActive(option.value),
              'text-dim hover:text-fg': !isActive(option.value),
            }}
            class="inline-flex h-7 items-center gap-1.5 rounded px-2 text-[11px] font-medium transition-colors"
          >
            <Show when={option.icon}>{(icon) => <Icon name={icon()} size={12} />}</Show>
            {option.label}
          </button>
        )}
      </For>
    </div>
  );
}

interface ChangeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
  /** Briefly brighten the value when its rendered percentage actually changes. */
  flash?: boolean;
}

const CHANGE_SIZES = {
  sm: 'text-[11px]',
  md: 'text-[12px]',
  lg: 'text-[14px]',
};

export const Change: Component<ChangeProps> = (props) => {
  const up = () => props.value >= 0;
  const text = createMemo(() => pct(props.value));
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  const [flash, setFlash] = createSignal(false);
  let previous = text();
  let timer: number | undefined;

  createEffect(
    on(
      text,
      (next) => {
        if (next === previous) return;
        previous = next;
        if (!props.flash || reduceMotion) return;

        window.clearTimeout(timer);
        setFlash(true);
        timer = window.setTimeout(() => setFlash(false), 340);
      },
      { defer: true },
    ),
  );

  onCleanup(() => window.clearTimeout(timer));

  return (
    <span
      class={`font-mono tabular-nums transition-[filter] duration-200 ${
        up() ? 'text-up' : 'text-down'
      } ${CHANGE_SIZES[props.size ?? 'md']} ${props.class ?? ''}`}
      style={{ filter: flash() ? 'brightness(1.45)' : undefined }}
      title={Number.isFinite(props.value) ? `${props.value.toFixed(4)}%` : undefined}
    >
      {text()}
    </span>
  );
};

interface PriceProps {
  value: number;
  class?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  flash?: boolean;
}

const PRICE_SIZES = {
  xs: 'text-[11px]',
  sm: 'text-[12px]',
  md: 'text-[13px]',
  lg: 'text-[18px]',
  xl: 'text-[24px] sm:text-[30px]',
};

export const Price: Component<PriceProps> = (props) => {
  const [flash, setFlash] = createSignal<'up' | 'down' | null>(null);
  let previous = props.value;
  let timer: number | undefined;

  createEffect(
    on(
      () => props.value,
      (next) => {
        if (next === previous || props.flash === false) {
          previous = next;
          return;
        }

        window.clearTimeout(timer);
        setFlash(next > previous ? 'up' : 'down');
        previous = next;
        timer = window.setTimeout(() => setFlash(null), 450);
      },
      { defer: true },
    ),
  );

  onCleanup(() => window.clearTimeout(timer));

  return (
    <span
      class={`font-mono tabular-nums transition-colors duration-300 ${
        flash() === 'up' ? 'text-up' : flash() === 'down' ? 'text-down' : 'text-fg'
      } ${PRICE_SIZES[props.size ?? 'md']} ${props.class ?? ''}`}
    >
      {formatPrice(props.value)}
    </span>
  );
};

const COIN_SIZES = {
  xs: 'h-5 w-5 text-[8px]',
  sm: 'h-7 w-7 text-[9px]',
  md: 'h-9 w-9 text-[10px]',
  lg: 'h-12 w-12 text-[11px]',
  xl: 'h-11 w-11 text-[12px]',
};

const Monogram: Component<{
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}> = (props) => {
  const label = () => props.symbol.replace(/^1000/, '').slice(0, 3).toUpperCase();

  return (
    <span
      class={`inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-[#191b1e] font-mono font-medium tracking-tight text-muted ${COIN_SIZES[props.size ?? 'md']} ${props.class ?? ''}`}
      aria-hidden="true"
    >
      {label()}
    </span>
  );
};

const LOGO_BASE = 'https://bin.bnbstatic.com/static/assets/logos';

/**
 * Official Binance asset logo, with the monogram as a fallback for assets whose
 * logo is unavailable.
 */
export const CoinIcon: Component<{
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}> = (props) => {
  const [failed, setFailed] = createSignal(false);

  createEffect(
    on(
      () => props.symbol,
      () => setFailed(false),
      { defer: true },
    ),
  );

  return (
    <Show
      when={!failed()}
      fallback={<Monogram symbol={props.symbol} size={props.size} class={props.class} />}
    >
      <img
        src={`${LOGO_BASE}/${encodeURIComponent(props.symbol)}.png`}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        onError={() => setFailed(true)}
        class={`shrink-0 object-contain ${COIN_SIZES[props.size ?? 'md']} ${props.class ?? ''}`}
      />
    </Show>
  );
};

export const RangeMeter: Component<{
  position: number;
  low: number;
  high: number;
  labels?: boolean;
  marker?: 'muted' | 'fg';
  class?: string;
}> = (props) => (
  <div class={props.class}>
    <div
      class="relative h-1 rounded-full bg-white/[0.07]"
      title={`${formatPrice(props.low)} – ${formatPrice(props.high)}`}
    >
      <span
        class={`absolute top-1/2 h-2.5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full ${
          props.marker === 'fg' ? 'bg-fg' : 'bg-muted'
        }`}
        style={{ left: `${props.position}%` }}
      />
    </div>
    <Show when={props.labels}>
      <div class="mt-1.5 flex items-center justify-between font-mono text-[10px] tabular-nums text-dim">
        <span>{formatPrice(props.low)}</span>
        <span>{formatPrice(props.high)}</span>
      </div>
    </Show>
  </div>
);

export const WatchButton: Component<{
  watched: boolean;
  symbol: string;
  onToggle: () => void;
  class?: string;
}> = (props) => (
  <button
    type="button"
    onClick={props.onToggle}
    aria-pressed={props.watched}
    aria-label={`${props.watched ? 'Remove' : 'Add'} ${props.symbol} ${
      props.watched ? 'from' : 'to'
    } watchlist`}
    classList={{
      'text-fg': props.watched,
      'text-dim hover:text-fg': !props.watched,
    }}
    class={`inline-flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-white/[0.06] ${props.class ?? ''}`}
  >
    <Icon name="star" size={12} fill={props.watched} />
  </button>
);

export const RetryState: Component<{ message: string; onRetry: () => void }> = (props) => (
  <div class="flex flex-col items-center gap-2 py-10">
    <Icon name="alert" size={16} class="text-down" />
    <p class="text-[12px] text-muted">{props.message}</p>
    <Button variant="ghost" size="sm" onClick={props.onRetry}>
      Retry
    </Button>
  </div>
);

const STATE_META = {
  live: { label: 'Live', dot: 'bg-up', text: 'text-up' },
  connecting: { label: 'Connecting', dot: 'bg-warn', text: 'text-warn' },
  offline: { label: 'Offline', dot: 'bg-down', text: 'text-down' },
} as const;

export const StatusPill: Component<{
  state: ConnectionState;
  compact?: boolean;
  onRetry?: () => void;
}> = (props) => {
  const meta = () => STATE_META[props.state];

  return (
    <span
      class="inline-flex items-center gap-1.5"
      role="status"
      aria-label={props.compact ? meta().label : undefined}
    >
      <span class={`h-1.5 w-1.5 rounded-full ${meta().dot}`} />
      <Show when={!props.compact}>
        <span class={`text-[11px] font-medium ${meta().text}`}>{meta().label}</span>
      </Show>
      <Show when={props.state === 'offline' && props.onRetry}>
        <button
          type="button"
          onClick={props.onRetry}
          class="text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-fg"
        >
          Retry
        </button>
      </Show>
    </span>
  );
};

export const Skeleton: Component<{ class?: string }> = (props) => (
  <div class={`animate-pulse rounded bg-white/[0.045] ${props.class ?? ''}`} />
);

export const Empty: Component<{
  title: string;
  body?: string;
  icon?: IconName;
  iconClass?: string;
  action?: JSX.Element;
}> = (props) => (
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <Icon name={props.icon ?? 'search'} size={18} class={props.iconClass ?? 'text-dim'} />
    <h3 class="mt-3 text-[14px] font-medium text-fg">{props.title}</h3>
    <Show when={props.body}>
      <p class="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{props.body}</p>
    </Show>
    <Show when={props.action}>
      <div class="mt-4">{props.action}</div>
    </Show>
  </div>
);

export const Kbd: ParentComponent<{ class?: string }> = (props) => (
  <kbd
    class={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-line px-1 font-mono text-[10px] leading-none text-dim ${props.class ?? ''}`}
  >
    {props.children}
  </kbd>
);
