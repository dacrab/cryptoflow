import { Show } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useMarket } from '../lib/market';
import { createNow } from '../lib/hooks';
import { time } from '../lib/format';
import { Button, Kbd, StatusPill } from './ui';
import { Icon } from './Icon';

function Wordmark() {
  return (
    <A href="/" class="flex shrink-0 items-center gap-2" aria-label="CryptoFlow home">
      <svg viewBox="0 0 24 24" class="h-4 w-4 text-fg" aria-hidden="true">
        <path
          d="M5 19V9M12 19V5M19 19v-7"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        />
      </svg>
      <span class="text-[13px] font-semibold tracking-tight text-fg">CryptoFlow</span>
    </A>
  );
}

export function Header(props: { onOpenPalette: () => void }) {
  const market = useMarket();
  const location = useLocation();
  const now = createNow(1000);

  return (
    <header class="sticky top-0 z-40 border-b border-line bg-ink">
      <div class="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-6 px-4 sm:px-6">
        <Wordmark />

        <nav class="hidden items-center gap-5 sm:flex" aria-label="Main">
          <A
            href="/"
            end
            class="text-[13px] transition-colors"
            activeClass="text-fg"
            inactiveClass="text-muted hover:text-fg"
          >
            Markets
          </A>
          <A
            href="/watchlist"
            class="flex items-center gap-1.5 text-[13px] transition-colors"
            activeClass="text-fg"
            inactiveClass="text-muted hover:text-fg"
          >
            Watchlist
            <Show when={market.watchlist().length}>
              {(count) => <span class="font-mono text-[11px] text-dim">{count()}</span>}
            </Show>
          </A>
        </nav>

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <div class="hidden items-center gap-3 md:flex">
            <StatusPill state={market.connection()} onRetry={market.reconnect} />
            <span class="font-mono text-[11px] tabular-nums text-dim" title="Coordinated Universal Time">
              {time(now())} <span class="text-dim/70">UTC</span>
            </span>
          </div>

          <span class="md:hidden">
            <StatusPill state={market.connection()} compact onRetry={market.reconnect} />
          </span>

          <button
            type="button"
            onClick={props.onOpenPalette}
            class="inline-flex h-8 items-center gap-2 rounded-md border border-line bg-panel pl-2.5 pr-2 text-[12px] text-muted transition-colors hover:border-[#35383d] hover:text-fg"
            aria-label="Search markets"
          >
            <Icon name="search" size={13} />
            <span class="hidden sm:inline">Search</span>
            <span class="hidden sm:inline-flex"><Kbd>⌘K</Kbd></span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={market.refresh}
            title="Refresh market snapshot"
            aria-label="Refresh market snapshot"
          >
            <Icon name="refresh" size={14} class={market.refreshing() ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <Show when={location.pathname === '/' || location.pathname.startsWith('/watchlist')}>
        <div class="border-t border-line sm:hidden">
          <div class="mx-auto flex w-full max-w-[1440px] items-center gap-5 px-4 py-2">
            <A
              href="/"
              end
              class="text-[12px] transition-colors"
              activeClass="text-fg"
              inactiveClass="text-muted"
            >
              Markets
            </A>
            <A
              href="/watchlist"
              class="flex items-center gap-1.5 text-[12px] transition-colors"
              activeClass="text-fg"
              inactiveClass="text-muted"
            >
              Watchlist
              <span class="font-mono text-[11px] text-dim">{market.watchlist().length}</span>
            </A>
            <span class="ml-auto font-mono text-[11px] tabular-nums text-dim">
              {time(now())} UTC
            </span>
          </div>
        </div>
      </Show>
    </header>
  );
}
