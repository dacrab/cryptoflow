import { Component, ParentComponent, For, Show, splitProps, createSignal, createEffect, on, mergeProps, onCleanup } from 'solid-js';
import { fmt } from '../utils';
import type { ConnectionState } from '../api';

// ============================================
// Shared Constants
// ============================================

export const SKELETON_ROWS_5 = [0, 1, 2, 3, 4];
export const SKELETON_ROWS_8 = [0, 1, 2, 3, 4, 5, 6, 7];
export const SKELETON_ROWS_10 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// ============================================
// Card - Reusable container
// ============================================

interface CardProps {
  class?: string;
  padding?: 'none' | 'sm' | 'md';
}

const CARD_PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
} as const;

export const Card: ParentComponent<CardProps> = (rawProps) => {
  const props = mergeProps({ padding: 'md' as const }, rawProps);
  return (
    <div class={`bg-zinc-900/50 rounded-xl border border-zinc-800/50 ${CARD_PADDING[props.padding]} ${props.class ?? ''}`}>
      {props.children}
    </div>
  );
};

// ============================================
// createPolling - Reusable polling hook
// ============================================

export function createPolling<T>(
  fetcher: () => Promise<T | null>,
  options: { interval: number; enabled?: () => boolean } = { interval: 2000 }
) {
  const [data, setData] = createSignal<T | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(false);

  const fetchData = async () => {
    try {
      const result = await fetcher();
      if (result !== null) {
        setData(() => result);
        setError(false);
      }
    } catch {
      if (data() === null) setError(true);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    if (options.enabled && !options.enabled()) return;
    
    setLoading(true);
    setData(null);
    fetchData();
    
    const interval = setInterval(fetchData, options.interval);
    onCleanup(() => clearInterval(interval));
  });

  return { data, loading, error, refetch: fetchData };
}

// ============================================
// Live Dot - Pulsing indicator for realtime data
// ============================================

export const LiveDot: Component<{ show: boolean; class?: string }> = (props) => (
  <Show when={props.show}>
    <span class={`relative flex h-1.5 w-1.5 ${props.class ?? ''}`}>
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
  </Show>
);

// ============================================
// Live Indicator - Dot with "Live" text
// ============================================

export const LiveIndicator: Component<{ show: boolean; class?: string }> = (props) => (
  <Show when={props.show}>
    <span class={`flex items-center gap-1.5 text-[10px] text-zinc-500 ${props.class ?? ''}`}>
      <LiveDot show />
      Live
    </span>
  </Show>
);

// ============================================
// Connection Status Indicator
// ============================================

const STATE_CONFIG = {
  connected: { color: 'bg-emerald-500', ping: true, text: 'Live', textColor: 'text-emerald-400' },
  connecting: { color: 'bg-amber-500', ping: false, text: 'Connecting...', textColor: 'text-amber-400' },
  disconnected: { color: 'bg-red-500', ping: false, text: 'Disconnected', textColor: 'text-red-400' },
} as const;

export const ConnectionIndicator: Component<{ state: ConnectionState; onReconnect?: () => void; class?: string }> = (props) => {
  const config = () => STATE_CONFIG[props.state];

  return (
    <div class={`flex items-center gap-2 ${props.class ?? ''}`}>
      <span class="flex items-center gap-1.5">
        <span class="relative flex h-2 w-2">
          <Show when={config().ping}>
            <span class={`animate-ping absolute inline-flex h-full w-full rounded-full ${config().color} opacity-75`} />
          </Show>
          <span class={`relative inline-flex rounded-full h-2 w-2 ${config().color} ${props.state === 'connecting' ? 'animate-pulse' : ''}`} />
        </span>
        <span class={`text-xs font-medium ${config().textColor}`}>{config().text}</span>
      </span>
      <Show when={props.state === 'disconnected' && props.onReconnect}>
        <button onClick={props.onReconnect} class="text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-2">
          Retry
        </button>
      </Show>
    </div>
  );
};

// ============================================
// Stat Card - Reusable stat display
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  live?: boolean;
  variant?: 'default' | 'success' | 'danger';
  class?: string;
}

export const StatCard: Component<StatCardProps> = (rawProps) => {
  const props = mergeProps({ variant: 'default' as const, live: false }, rawProps);
  
  const valueColor = () => {
    if (props.variant === 'success') return 'text-emerald-400';
    if (props.variant === 'danger') return 'text-red-400';
    return '';
  };

  return (
    <Card class={props.class}>
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[10px] text-zinc-500 uppercase">{props.label}</span>
        <LiveDot show={props.live} />
      </div>
      <div class={`text-lg font-semibold font-mono ${valueColor()}`}>{props.value}</div>
    </Card>
  );
};

// ============================================
// Mini Stat Card - For sidebar stats
// ============================================

interface MiniStatCardProps {
  label: string;
  value: string | number;
  live?: boolean;
  variant?: 'default' | 'success' | 'danger';
}

export const MiniStatCard: Component<MiniStatCardProps> = (rawProps) => {
  const props = mergeProps({ variant: 'default' as const, live: false }, rawProps);
  
  const valueColor = () => {
    if (props.variant === 'success') return 'text-emerald-400';
    if (props.variant === 'danger') return 'text-red-400';
    return '';
  };

  return (
    <div class="bg-zinc-800/30 rounded-lg p-3">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[10px] text-zinc-500 uppercase">{props.label}</span>
        <LiveDot show={props.live} />
      </div>
      <div class={`text-sm font-mono ${valueColor()}`}>{props.value}</div>
    </div>
  );
};

// ============================================
// Coin Avatar - Consistent image with fallback
// ============================================

interface CoinAvatarProps {
  src: string;
  symbol: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

const AVATAR_SIZES = {
  sm: { img: 'w-6 h-6', fallback: 24 },
  md: { img: 'w-8 h-8', fallback: 32 },
  lg: { img: 'w-10 h-10', fallback: 40 },
  xl: { img: 'w-14 h-14', fallback: 56 },
} as const;

export const CoinAvatar: Component<CoinAvatarProps> = (rawProps) => {
  const props = mergeProps({ size: 'md' as const }, rawProps);
  const size = () => AVATAR_SIZES[props.size];

  return (
    <img
      src={props.src}
      alt=""
      class={`${size().img} rounded-full ring-1 ring-white/10 ${props.class ?? ''}`}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = `https://ui-avatars.com/api/?name=${props.symbol}&background=333&color=fff&size=${size().fallback}`;
      }}
    />
  );
};

// ============================================
// Price Display with Flash Animation
// ============================================

const PRICE_SIZES = {
  sm: { price: 'text-xs', change: 'text-[10px]' },
  md: { price: 'text-sm', change: 'text-sm' },
  lg: { price: 'text-3xl', change: 'text-sm' },
} as const;

interface PriceProps {
  price: number;
  change?: number;
  size?: 'sm' | 'md' | 'lg';
  showChange?: boolean;
  class?: string;
}

export const Price: Component<PriceProps> = (rawProps) => {
  const props = mergeProps({ size: 'md' as const, showChange: true }, rawProps);
  const [flash, setFlash] = createSignal<'up' | 'down' | null>(null);
  const [prev, setPrev] = createSignal(props.price);

  createEffect(on(() => props.price, (newPrice) => {
    const p = prev();
    if (p !== 0 && p !== newPrice) {
      setFlash(newPrice > p ? 'up' : 'down');
      setTimeout(() => setFlash(null), 500);
    }
    setPrev(newPrice);
  }, { defer: true }));

  const s = () => PRICE_SIZES[props.size];
  const up = () => (props.change ?? 0) >= 0;

  return (
    <div class={`text-right ${props.class ?? ''}`}>
      <div class={`font-mono transition-colors duration-300 ${s().price} ${flash() === 'up' ? 'text-emerald-400' : flash() === 'down' ? 'text-red-400' : ''}`}>
        {fmt(props.price)}
      </div>
      <Show when={props.showChange && props.change !== undefined}>
        <span class={`font-mono ${s().change} ${up() ? 'text-emerald-400' : 'text-red-400'}`}>
          {up() ? '+' : ''}{props.change!.toFixed(2)}%
        </span>
      </Show>
    </div>
  );
};

// ============================================
// Button & Input
// ============================================

const BUTTON_VARIANTS = {
  primary: 'bg-white text-black hover:bg-white/90',
  secondary: 'bg-white/10 text-white hover:bg-white/20',
  ghost: 'text-zinc-400 hover:text-white hover:bg-white/5',
} as const;

interface ButtonProps {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: 'sm' | 'md';
  disabled?: boolean;
  loading?: boolean;
  class?: string;
  title?: string;
  onClick?: (e: MouseEvent) => void;
}

export const Button: ParentComponent<ButtonProps> = (rawProps) => {
  const [local, rest] = splitProps(
    mergeProps({ variant: 'ghost' as const, size: 'md' as const }, rawProps),
    ['variant', 'size', 'disabled', 'loading', 'class', 'children']
  );
  const sizeClass = () => local.size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <button
      {...rest}
      type="button"
      disabled={local.disabled || local.loading}
      class={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${BUTTON_VARIANTS[local.variant]} ${sizeClass()} ${local.class ?? ''}`}
    >
      <Show when={local.loading}>
        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      </Show>
      {local.children}
    </button>
  );
};

interface InputProps {
  value: string;
  onInput: (v: string) => void;
  onClear?: () => void;
  placeholder?: string;
  class?: string;
  autofocus?: boolean;
  ref?: (el: HTMLInputElement) => void;
}

export const Input: Component<InputProps> = (props) => (
  <div class={`relative group ${props.class ?? ''}`}>
    <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      ref={props.ref}
      type="text"
      value={props.value}
      onInput={(e) => props.onInput(e.currentTarget.value)}
      placeholder={props.placeholder}
      autofocus={props.autofocus}
      class="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/20 pl-10 pr-8 py-2 transition-all"
    />
    <Show when={props.value && props.onClear}>
      <button onClick={props.onClear} class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </Show>
    <Show when={!props.value}>
      <kbd class="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-zinc-600 bg-white/5 rounded border border-white/10">/</kbd>
    </Show>
  </div>
);

// ============================================
// Icons
// ============================================

export const StarIcon: Component<{ filled: boolean; class?: string }> = (props) => (
  <svg class={`w-4 h-4 ${props.class ?? ''}`} fill={props.filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

// ============================================
// Skeletons
// ============================================

export const Skeleton: Component<{ class?: string }> = (props) => (
  <div class={`animate-pulse bg-zinc-800/50 rounded ${props.class ?? ''}`} />
);

interface ListSkeletonProps {
  rows?: number;
}

export const ListSkeleton: Component<ListSkeletonProps> = (rawProps) => {
  const props = mergeProps({ rows: 8 }, rawProps);
  
  return (
    <div class="divide-y divide-zinc-800/30">
      <For each={Array(props.rows).fill(0)}>
        {() => (
          <div class="grid grid-cols-[2rem_1fr_auto] sm:grid-cols-[2rem_1fr_6rem_auto_2rem] items-center gap-2 sm:gap-3 px-3 py-3">
            <Skeleton class="w-5 h-4" />
            <div class="flex items-center gap-3">
              <Skeleton class="w-8 h-8 rounded-full" />
              <div class="space-y-1.5"><Skeleton class="w-24 h-4" /><Skeleton class="w-12 h-3" /></div>
            </div>
            <Skeleton class="w-16 h-8 hidden sm:block" />
            <div class="text-right space-y-1.5"><Skeleton class="w-20 h-4 ml-auto" /><Skeleton class="w-14 h-3 ml-auto" /></div>
          </div>
        )}
      </For>
    </div>
  );
};

interface SidebarSkeletonProps {
  rows?: number;
}

export const SidebarSkeleton: Component<SidebarSkeletonProps> = (rawProps) => {
  const props = mergeProps({ rows: 5 }, rawProps);
  
  return (
    <Card padding="none">
      <div class="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
        <Skeleton class="w-2 h-2 rounded-full" /><Skeleton class="w-20 h-3" />
      </div>
      <div class="divide-y divide-zinc-800/30">
        <For each={Array(props.rows).fill(0)}>
          {() => (
            <div class="flex items-center gap-2 px-3 py-2">
              <Skeleton class="w-6 h-6 rounded-full" />
              <Skeleton class="w-12 h-4 flex-1" />
              <div class="text-right space-y-1"><Skeleton class="w-14 h-3" /><Skeleton class="w-10 h-2" /></div>
            </div>
          )}
        </For>
      </div>
    </Card>
  );
};

export const ChartSkeleton: Component = () => (
  <div class="space-y-4">
    <div class="flex justify-between items-start">
      <div class="space-y-2"><Skeleton class="w-36 h-8" /><Skeleton class="w-28 h-4" /></div>
      <div class="flex gap-1">
        <For each={SKELETON_ROWS_5}>{() => <Skeleton class="w-10 h-7 rounded-md" />}</For>
      </div>
    </div>
    <Skeleton class="w-full h-48 rounded-lg" />
  </div>
);
