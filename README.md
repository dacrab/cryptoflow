# CryptoFlow

A live crypto market terminal built with SolidJS. Streams the top 100 USDT markets from Binance, with URL-driven search and sorting, a persistent watchlist, price history, an order book, and a recent-trades tape.

No mock prices, fake market caps, or analytics scripts. Everything on screen comes from Binance's public API.

## Features

- **Live market data** — one WebSocket (`!miniTicker@arr`) updates prices, 24h change, volume, and 24h ranges in place.
- **Top 100 by volume** — USDT spot pairs, stable and wrapped assets excluded, ranked by 24h quote volume.
- **Search and sort** — name/symbol search with a deferred filter, plus sortable table columns and a card view. State lives in the URL (`q`, `sort`, `dir`, `view`, `watch`).
- **Watchlist** — star assets from the table, grid, palette, or detail page. Persisted to `localStorage`, with undoable toasts.
- **Asset terminal** — 24h/7d/30d/90d/1y charts with crosshair, live price, volume bars, 24h range, market stats, and a Binance link.
- **Order book and trades** — REST polling for depth and recent fills; polling pauses while the tab is hidden.
- **Command palette** — `⌘K`/`Ctrl K`, keyboard navigation, and direct navigation to any tracked asset.
- **Quiet, responsive UI** — near-monochrome surfaces, official Binance asset logos, green/red only for direction, system fonts, flat borders, and a mobile-first table layout.

## SolidJS feature map

This project intentionally exercises the framework rather than a single signal per page.

| Solid feature | Used for |
| --- | --- |
| `createSignal`, `createMemo`, `createEffect` | Market stats, filters, chart model, clock, polling |
| `createResource` + `Suspense` + `ErrorBoundary` | Market snapshot, reactive order-book/trade polling, lazy routes, route-level failures |
| `createStore`, `produce`, `reconcile` | 100-coin market store, watchlist, toasts |
| `createSelector` | Fast per-row watchlist and palette-selection state |
| `createDeferred` | Debounced market search |
| `useTransition` | Palette navigation |
| `batch`, `on`, `onMount`, `onCleanup` | Batched WebSocket ticks, lifecycle, timers, sockets |
| `For`, `Index`, `Show`, `Switch`, `Match`, `Dynamic` | Lists, loading/error states, dynamic icons |
| `Portal` | Command palette and toast viewport |
| `createContext` / `useContext` | Market and toast providers |
| `lazy` + router hooks | Code-split pages, `useParams`, `useSearchParams`, `useLocation`, `useNavigate` |
| `query` / `revalidate` | Cached kline requests |
| `mergeProps`, `splitProps` | Shared UI primitives |
| `createUniqueId` | SVG gradient IDs |

## Architecture

```text
src/
  lib/
    api.ts          Binance REST + WebSocket parsing
    market.tsx      Single market provider: snapshot, stream, watchlist, derived stats
    toast.tsx       Toast provider and undo actions
    hooks.ts        Clock and visibility-aware polling
    assets.ts       Human-readable asset names
    format.ts       Price, percentage, quantity, and time formatting
  components/       Header, table/grid, chart, order book, trades, palette
  pages/            Dashboard, CoinDetail, Watchlist, NotFound
  app.tsx           Providers, shell, route suspense/error boundaries
  index.tsx         Lazy router
```

The market provider owns the only copy of market data. Routes read from it through context; the REST snapshot seeds the store and the WebSocket mutates it with `reconcile`/`produce`, so rows update without refetching the list.

## Run it

```bash
bun install
bun dev
```

```bash
bun run typecheck
bun run build
bun run preview
```

Requires a modern browser with WebSocket support. Binance's public endpoints must be reachable.

## Keyboard

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl K` | Open the command palette |
| `↑` / `↓` | Move through palette results |
| `Enter` | Open the selected asset |
| `/` | Focus the market search on the dashboard |
| `Esc` | Close the palette, or clear dashboard filters |

## Data and caveats

- Market data: [Binance public API](https://binance-docs.github.io/apidocs/spot/en/) (`/ticker/24hr`, `/klines`, `/depth`, `/trades`, `!miniTicker@arr`).
- The dashboard is intentionally limited to the top 100 USDT pairs by 24h volume; other assets return the "not tracked" state.
- All timestamps and chart axes use UTC.
- Watchlists are stored locally in the browser. Nothing is sent to a server.
- Prices are indicative and may be delayed by the exchange or your connection. **Not financial advice.**

## License

MIT
