import { Component, ParentComponent, For, Show, createSignal, createEffect, on, onCleanup } from 'solid-js';
import { fmt } from '../utils';
import type { ConnectionState } from '../api';

export const Card: ParentComponent<{ class?: string }> = (props) => (
  <div class={`bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-4 ${props.class ?? ''}`}>
    {props.children}
  </div>
);

export const LiveDot: Component<{ show: boolean }> = (props) => (
  <Show when={props.show}>
    <span class="relative flex h-1.5 w-1.5">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
    </span>
  </Show>
);

const STATE_CONFIG = {
  connected: { color: 'bg-emerald-500', ping: true, text: 'Live', textColor: 'text-emerald-400' },
  connecting: { color: 'bg-amber-500', ping: false, text: 'Connecting...', textColor: 'text-amber-400' },
  disconnected: { color: 'bg-red-500', ping: false, text: 'Disconnected', textColor: 'text-red-400' },
} as const;

export const ConnectionIndicator: Component<{ state: ConnectionState; onReconnect?: () => void }> = (props) => (
  <div class="flex items-center gap-2">
    <span class="flex items-center gap-1.5">
      <span class="relative flex h-2 w-2">
        <Show when={STATE_CONFIG[props.state].ping}>
          <span class={`animate-ping absolute inline-flex h-full w-full rounded-full ${STATE_CONFIG[props.state].color} opacity-75`} />
        </Show>
        <span class={`relative inline-flex rounded-full h-2 w-2 ${STATE_CONFIG[props.state].color} ${props.state === 'connecting' ? 'animate-pulse' : ''}`} />
      </span>
      <span class={`text-xs font-medium ${STATE_CONFIG[props.state].textColor}`}>{STATE_CONFIG[props.state].text}</span>
    </span>
    <Show when={props.state === 'disconnected' && props.onReconnect}>
      <button onClick={props.onReconnect} class="text-xs text-zinc-400 hover:text-white transition-colors underline underline-offset-2">
        Retry
      </button>
    </Show>
  </div>
);

export const StatCard: Component<{ label: string; value: string | number; live?: boolean; variant?: 'default' | 'success' | 'danger' }> = (props) => {
  const color = () => props.variant === 'success' ? 'text-emerald-400' : props.variant === 'danger' ? 'text-red-400' : '';
  return (
    <Card>
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[10px] text-zinc-500 uppercase">{props.label}</span>
        <LiveDot show={props.live ?? false} />
      </div>
      <div class={`text-lg font-semibold font-mono ${color()}`}>{props.value}</div>
    </Card>
  );
};

export const MiniStatCard: Component<{ label: string; value: string | number; live?: boolean; variant?: 'default' | 'success' | 'danger' }> = (props) => {
  const color = () => props.variant === 'success' ? 'text-emerald-400' : props.variant === 'danger' ? 'text-red-400' : '';
  return (
    <div class="bg-zinc-800/30 rounded-lg p-3">
      <div class="flex items-center gap-1.5 mb-1">
        <span class="text-[10px] text-zinc-500 uppercase">{props.label}</span>
        <LiveDot show={props.live ?? false} />
      </div>
      <div class={`text-sm font-mono ${color()}`}>{props.value}</div>
    </div>
  );
};

export const CoinAvatar: Component<{ src: string; symbol: string; size?: 'sm' | 'md' | 'lg' }> = (props) => {
  const sizeClass = () => props.size === 'sm' ? 'w-6 h-6' : props.size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const fallbackSize = () => props.size === 'sm' ? 24 : props.size === 'lg' ? 40 : 32;

  const handleError = (e: Event) => {
    const img = e.currentTarget as HTMLImageElement;
    const sym = props.symbol.toLowerCase();
    if (!img.src.includes('bnbstatic')) {
      img.src = `https://bin.bnbstatic.com/image/admin_mgs_image_upload/20201110/87496d50-2408-43e1-ad4c-78b47b448a6a/icon/${sym}.png`;
    } else {
      img.src = `https://ui-avatars.com/api/?name=${props.symbol.toUpperCase()}&background=27272a&color=a1a1aa&size=${fallbackSize()}&bold=true&length=2`;
    }
  };

  return (
    <img
      src={props.src}
      alt={props.symbol}
      class={`${sizeClass()} rounded-full ring-1 ring-white/10`}
      loading="lazy"
      onError={handleError}
    />
  );
};

export const Price: Component<{ price: number; change?: number; size?: 'sm' | 'md' | 'lg'; showChange?: boolean; class?: string }> = (props) => {
  const [flash, setFlash] = createSignal<'up' | 'down' | null>(null);
  const [prev, setPrev] = createSignal(props.price);

  createEffect(on(() => props.price, (newPrice) => {
    const p = prev();
    if (p !== 0 && p !== newPrice) {
      setFlash(newPrice > p ? 'up' : 'down');
      const t = setTimeout(() => setFlash(null), 500);
      onCleanup(() => clearTimeout(t));
    }
    setPrev(newPrice);
  }, { defer: true }));

  const priceSize = () => props.size === 'sm' ? 'text-xs' : props.size === 'lg' ? 'text-3xl' : 'text-sm';
  const changeSize = () => props.size === 'lg' ? 'text-sm' : 'text-[10px]';
  const up = () => (props.change ?? 0) >= 0;

  return (
    <div class={`text-right ${props.class ?? ''}`}>
      <div class={`font-mono transition-colors duration-300 ${priceSize()} ${flash() === 'up' ? 'text-emerald-400' : flash() === 'down' ? 'text-red-400' : ''}`}>
        {fmt(props.price)}
      </div>
      <Show when={(props.showChange ?? true) && props.change !== undefined}>
        <span class={`font-mono ${changeSize()} ${up() ? 'text-emerald-400' : 'text-red-400'}`}>
          {up() ? '+' : ''}{props.change!.toFixed(2)}%
        </span>
      </Show>
    </div>
  );
};

export const Button: ParentComponent<{ variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md'; disabled?: boolean; loading?: boolean; class?: string; title?: string; onClick?: (e: MouseEvent) => void }> = (props) => {
  const variantClass = () => props.variant === 'primary' ? 'bg-white text-black hover:bg-white/90' : props.variant === 'secondary' ? 'bg-white/10 text-white hover:bg-white/20' : 'text-zinc-400 hover:text-white hover:bg-white/5';
  const sizeClass = () => props.size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <button
      type="button"
      disabled={props.disabled || props.loading}
      onClick={props.onClick}
      title={props.title}
      class={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all active:scale-[0.98] disabled:opacity-50 ${variantClass()} ${sizeClass()} ${props.class ?? ''}`}
    >
      <Show when={props.loading}>
        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      </Show>
      {props.children}
    </button>
  );
};

export const Input: Component<{ value: string; onInput: (v: string) => void; onClear?: () => void; placeholder?: string; class?: string; autofocus?: boolean; ref?: (el: HTMLInputElement) => void }> = (props) => (
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

export const StarIcon: Component<{ filled: boolean }> = (props) => (
  <svg class="w-4 h-4" fill={props.filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

export const Skeleton: Component<{ class?: string }> = (props) => (
  <div class={`animate-pulse bg-zinc-800/50 rounded ${props.class ?? ''}`} />
);

export const ListSkeleton: Component<{ rows?: number }> = (props) => (
  <div class="divide-y divide-zinc-800/30">
    <For each={Array(props.rows ?? 8).fill(0)}>
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
