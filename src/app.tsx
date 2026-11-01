import {
  ErrorBoundary,
  ParentComponent,
  ParentProps,
  Show,
  Suspense,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { MarketProvider, useMarket } from './lib/market';
import { ToastProvider } from './lib/toast';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { Button, Empty, Kbd, Panel, Skeleton, StatusPill } from './components/ui';

function RouteSkeleton() {
  return (
    <div class="space-y-4 py-2">
      <Skeleton class="h-16 w-full" />
      <Skeleton class="h-72 w-full" />
    </div>
  );
}

function RouteError(props: { error: Error; reset: () => void }) {
  return (
    <div class="flex min-h-[50vh] items-center justify-center py-10">
      <Panel flush class="w-full max-w-md">
        <Empty
          icon="alert"
          iconClass="text-down"
          title="Something went wrong"
          body={props.error.message}
          action={
            <div class="flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={props.reset}>
                Try again
              </Button>
              <A href="/">
                <Button variant="ghost" size="sm">
                  Back to markets
                </Button>
              </A>
            </div>
          }
        />
      </Panel>
    </div>
  );
}

function Footer() {
  const market = useMarket();

  return (
    <footer class="mt-auto border-t border-line">
      <div class="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-5 text-[11px] text-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span class="text-muted">CryptoFlow</span>
          <span>·</span>
          <span>Data from Binance</span>
          <span>·</span>
          <span>Times in UTC</span>
          <span>·</span>
          <span>Not financial advice</span>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <span class="flex items-center gap-1">
            <Kbd>/</Kbd> search
          </span>
          <span class="flex items-center gap-1">
            <Kbd>⌘K</Kbd> jump
          </span>
          <StatusPill state={market.connection()} compact onRetry={market.reconnect} />
        </div>
      </div>
    </footer>
  );
}

function Shell(props: ParentProps) {
  const location = useLocation();
  const [paletteOpen, setPaletteOpen] = createSignal(false);

  createEffect(
    on(
      () => location.pathname,
      () => window.scrollTo(0, 0),
    ),
  );

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }

      if (event.key === 'Escape' && paletteOpen()) {
        setPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown));
  });

  return (
    <div class="flex min-h-screen flex-col">
      <Header onOpenPalette={() => setPaletteOpen(true)} />

      <main class="flex-1 py-6">
        <div class="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
          <Show when={location.pathname} keyed>
            <ErrorBoundary
              fallback={(error, reset) => <RouteError error={error} reset={reset} />}
            >
              <Suspense fallback={<RouteSkeleton />}>{props.children}</Suspense>
            </ErrorBoundary>
          </Show>
        </div>
      </main>

      <Footer />
      <CommandPalette open={paletteOpen()} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export const Root: ParentComponent = (props) => (
  <ToastProvider>
    <MarketProvider>
      <Shell>{props.children}</Shell>
    </MarketProvider>
  </ToastProvider>
);
