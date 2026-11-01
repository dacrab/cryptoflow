import {
  For,
  Show,
  batch,
  createEffect,
  createMemo,
  createSelector,
  createSignal,
  on,
  onCleanup,
  useTransition,
} from 'solid-js';
import { Portal } from 'solid-js/web';
import { useNavigate } from '@solidjs/router';
import { useMarket } from '../lib/market';
import { Change, CoinIcon, Kbd, Price } from './ui';
import { Icon } from './Icon';
import type { Coin } from '../lib/types';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette(props: CommandPaletteProps) {
  const market = useMarket();
  const navigate = useNavigate();
  const [pending, start] = useTransition();

  const [query, setQuery] = createSignal('');
  const [active, setActive] = createSignal(0);

  const isActive = createSelector(active);

  const results = createMemo(() => {
    const term = query().trim().toLowerCase();
    const coins = market.coins();

    if (!term) return coins.slice(0, 7);

    return coins
      .filter(
        (coin) =>
          coin.symbol.toLowerCase().includes(term) || coin.name.toLowerCase().includes(term),
      )
      .slice(0, 8);
  });

  const activeCoin = createMemo(() => results()[active()] as Coin | undefined);

  createEffect(
    on(
      () => props.open,
      (open) => {
        if (!open) return;

        batch(() => {
          setQuery('');
          setActive(0);
        });

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        onCleanup(() => {
          document.body.style.overflow = previous;
        });
      },
    ),
  );

  createEffect(() => {
    const length = results().length;
    if (length && active() >= length) setActive(length - 1);
  });

  const go = (coin: Coin) => {
    props.onClose();
    start(() => navigate(`/coin/${coin.id}`));
  };

  const goToSearch = () => {
    const term = query().trim();
    if (!term) return;
    props.onClose();
    start(() => navigate(`/?q=${encodeURIComponent(term)}`));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!results().length) return;
      setActive((index) => (index + 1) % results().length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!results().length) return;
      setActive((index) => (index - 1 + results().length) % results().length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const coin = activeCoin();
      if (coin) go(coin);
      else goToSearch();
    }
  };

  return (
    <Show when={props.open}>
      <Portal mount={document.body}>
        <div
          class="fade-in fixed inset-0 z-[70] flex items-start justify-center bg-black/65 px-4 pt-[8vh] sm:pt-[12vh]"
          onClick={(event) => {
            if (event.target === event.currentTarget) props.onClose();
          }}
        >
          <div
            class="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-panel shadow-2xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-label="Search assets"
          >
            <div class="flex items-center gap-3 border-b border-line px-4">
              <Icon name="search" size={17} class="shrink-0 text-muted" />
              <input
                ref={(el) => requestAnimationFrame(() => el.focus())}
                value={query()}
                onInput={(event) => {
                  const value = event.currentTarget.value;
                  batch(() => {
                    setQuery(value);
                    setActive(0);
                  });
                }}
                onKeyDown={onKeyDown}
                placeholder="Search assets, symbols…"
                class="h-12 min-w-0 flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-dim"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-results"
                aria-activedescendant={
                  activeCoin() ? `command-option-${activeCoin()!.id}` : undefined
                }
                autocomplete="off"
                spellcheck={false}
              />
              <Show when={pending()}>
                <span class="h-3.5 w-3.5 animate-spin rounded-full border border-line border-t-fg" />
              </Show>
              <Kbd>ESC</Kbd>
            </div>

            <div
              id="command-results"
              role="listbox"
              aria-label="Search results"
              class="max-h-[48vh] overflow-y-auto p-2"
            >
              <Show
                when={results().length}
                fallback={
                  <div class="px-4 py-10 text-center">
                    <p class="text-sm text-muted">No assets match “{query()}”.</p>
                    <button
                      type="button"
                      onClick={goToSearch}
                      class="mt-3 text-[12px] font-medium text-fg underline underline-offset-2"
                    >
                      Search all markets
                    </button>
                  </div>
                }
              >
                <Show when={!query().trim()}>
                  <p class="px-3 py-2 text-[11px] leading-[1.4] text-dim">Top by volume</p>
                </Show>
                <For each={results()}>
                  {(coin, index) => (
                    <button
                      type="button"
                      id={`command-option-${coin.id}`}
                      role="option"
                      aria-selected={isActive(index())}
                      onMouseEnter={() => setActive(index())}
                      onClick={() => go(coin)}
                      classList={{
                        'bg-white/[0.055]': isActive(index()),
                      }}
                      class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors"
                    >
                      <CoinIcon symbol={coin.symbol} size="sm" />
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-[13px] font-medium text-fg">{coin.name}</span>
                        <span class="mt-0.5 block font-mono text-[10px] text-dim">
                          {coin.symbol}
                        </span>
                      </span>
                      <span class="hidden w-[104px] text-right sm:block">
                        <Price value={coin.price} size="sm" flash={false} />
                      </span>
                      <Change value={coin.change} size="sm" />
                      <Show when={isActive(index())}>
                        <Icon name="chevronRight" size={12} class="text-dim" />
                      </Show>
                    </button>
                  )}
                </For>
              </Show>
            </div>

            <div class="flex items-center justify-between border-t border-line px-4 py-2.5">
              <div class="flex items-center gap-3 text-[10px] text-dim">
                <span class="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> navigate
                </span>
                <span class="flex items-center gap-1">
                  <Kbd>↵</Kbd> open
                </span>
              </div>
              <span class="font-mono text-[10px] text-dim">Binance spot</span>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
}
