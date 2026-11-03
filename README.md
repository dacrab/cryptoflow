# CryptoFlow

A live crypto market dashboard for the top USDT pairs on Binance.

**Live demo:** https://cryptoflow-sepia.vercel.app

CryptoFlow shows real-time prices and makes it easy to search, sort, and explore the market. Star the coins you care about to build a watchlist, and open any asset for charts, an order book, and recent trades. Everything runs in the browser — no accounts, no tracking.

## Features

- Real-time prices for the top 100 USDT pairs on Binance
- Search by coin name or symbol
- Sort the market and switch between table and card views
- A watchlist that stays saved in your browser
- Detailed asset pages with price charts, order book, and recent trades
- Quick navigation with `⌘K` / `Ctrl K`
- Responsive layout for desktop and mobile

## Run it locally

You'll need [Bun](https://bun.sh) installed.

```bash
bun install
bun dev
```

Open the URL shown in your terminal.

To build for production:

```bash
bun run build
```

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl K` | Open the command palette |
| `↑` / `↓` | Move through results |
| `Enter` | Open the selected coin |
| `/` | Focus the search box |
| `Esc` | Close the palette or clear filters |

## Good to know

- Prices come from Binance's public API and may be slightly delayed.
- Your watchlist is saved in your browser — nothing is sent to a server.
- This is a market viewer, not financial advice.

## Built with

[SolidJS](https://www.solidjs.com), TypeScript, Vite, and Tailwind CSS. Hosted on Vercel.

## License

MIT
