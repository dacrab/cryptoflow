import { Component, Show, createSignal } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useStore } from '../store';
import { Button, Input } from './ui';

const Header: Component = () => {
  const store = useStore();
  const location = useLocation();
  const isHome = () => location.pathname === '/';
  const [showSearch, setShowSearch] = createSignal(false);

  return (
    <header class="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div class="h-14 flex items-center justify-between gap-4">
          <Show when={isHome()} fallback={
            <A href="/" class="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
              <svg class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span class="text-sm">Back</span>
            </A>
          }>
            <A href="/" class="flex items-center gap-2 group">
              <svg class="w-7 h-7" viewBox="0 0 32 32" fill="none">
                <rect x="2" y="2" width="28" height="28" rx="8" fill="#18181b" stroke="#27272a" stroke-width="1"/>
                <path d="M10 20L14 12L18 17L22 10" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="22" cy="10" r="2" fill="#10b981"/>
              </svg>
              <span class="font-semibold text-white/90 group-hover:text-white transition-colors">CryptoFlow</span>
            </A>
          </Show>

          <Show when={isHome()}>
            <div class="hidden sm:block flex-1 max-w-sm mx-4">
              <Input value={store.state.search} onInput={store.setSearch} onClear={store.clearSearch} placeholder="Search coins..." />
            </div>
          </Show>

          <div class="flex items-center gap-1">
            <Show when={isHome()}>
              <Button variant="ghost" size="sm" class="sm:hidden" onClick={() => setShowSearch(!showSearch())}>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
              <Button variant={store.state.watchlistOnly ? 'secondary' : 'ghost'} size="sm" onClick={store.toggleWatchlistOnly} title="Watchlist">
                <svg class={`w-4 h-4 ${store.state.watchlistOnly ? 'text-amber-400' : ''}`} fill={store.state.watchlistOnly ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <span class="hidden sm:inline">Watchlist</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={store.refetch} disabled={store.loading()} title="Refresh">
                <svg class={`w-4 h-4 ${store.loading() ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </Show>
          </div>
        </div>

        <Show when={isHome() && showSearch()}>
          <div class="pb-3 sm:hidden">
            <Input value={store.state.search} onInput={store.setSearch} onClear={() => { store.clearSearch(); setShowSearch(false); }} placeholder="Search..." autofocus />
          </div>
        </Show>
      </div>
    </header>
  );
};

export default Header;
