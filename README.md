# 🚀 CryptoFlow

A blazing-fast, real-time cryptocurrency dashboard built with SolidJS and the Binance API.

![CryptoFlow Dashboard](https://img.shields.io/badge/SolidJS-2c4f7c?style=for-the-badge&logo=solid&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

### Real-Time Data
- **Live price updates** via Binance WebSocket
- **Order book** with buy/sell pressure visualization
- **Recent trades** feed with live updates
- **Connection status indicator** with auto-reconnect

### Dashboard
- **Top 100 cryptocurrencies** sorted by volume
- **Market overview** - total market cap, volume, gainers/losers
- **Top movers** - biggest gainers and losers
- **7-day sparkline charts** for each coin
- **Search** - find coins by name or symbol
- **Sort** - by market cap, price, 24h change, or volume

### Watchlist
- **Star your favorite coins** - they move to the top
- **Persistent storage** - saved in localStorage
- **Quick access** in sidebar

### Coin Detail Page
- **Interactive price chart** - 24H, 7D, 30D, 90D, 1Y views
- **Live order book** - top 8 bid/ask levels
- **Recent trades** - last 15 trades with buy/sell indicators
- **Market stats** - market cap, volume, high/low, supply
- **24h price range** - visual indicator

### Performance
- **Non-blocking sparklines** - coins load instantly, charts load in background
- **Efficient updates** - batched WebSocket messages
- **O(1) lookups** - optimized data structures
- **Code splitting** - lazy-loaded pages

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [SolidJS](https://www.solidjs.com/) | Reactive UI framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [TailwindCSS v4](https://tailwindcss.com/) | Styling |
| [Binance API](https://binance-docs.github.io/apidocs/) | Market data & WebSocket |

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone https://github.com/dacrab/cryptoflow.git
cd cryptoflow

# Install dependencies
bun install

# Start development server
bun dev
```

### Build for Production

```bash
bun run build
bun run preview
```

## 📁 Project Structure

```
src/
├── api.ts              # Binance API & WebSocket manager
├── store.tsx           # Global state management
├── types.ts            # TypeScript interfaces
├── utils.ts            # Formatting utilities
├── index.tsx           # App entry point
├── index.css           # Global styles
├── components/
│   ├── ui.tsx          # Reusable UI components
│   ├── CoinList.tsx    # Main coin table
│   ├── PriceChart.tsx  # Interactive price chart
│   ├── OrderBook.tsx   # Live order book
│   ├── RecentTrades.tsx# Live trades feed
│   ├── Sparkline.tsx   # Mini chart component
│   ├── Header.tsx      # App header
│   └── ErrorBoundary.tsx
└── pages/
    ├── Dashboard.tsx   # Main dashboard
    ├── CoinDetail.tsx  # Coin detail page
    └── NotFound.tsx    # 404 page
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `W` | Toggle watchlist view |
| `R` | Refresh data |
| `Esc` | Clear search |

## 🎨 Design

- **Dark theme** optimized for extended viewing
- **Responsive** - works on desktop and mobile
- **Accessible** - proper focus states and contrast
- **Smooth animations** - price flash effects, hover states

## 📊 API Usage

This project uses the public Binance API:
- `GET /api/v3/ticker/24hr` - 24h price stats
- `GET /api/v3/klines` - Historical OHLCV data
- `GET /api/v3/depth` - Order book
- `GET /api/v3/trades` - Recent trades
- `WSS stream.binance.com` - Real-time ticker updates

No API key required for public endpoints.

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📝 License

MIT License - feel free to use this project for learning or building your own crypto dashboard.

---

Built with ❤️ using [SolidJS](https://www.solidjs.com/)
