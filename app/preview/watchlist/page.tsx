'use client';

import WatchlistTable from '@/components/watchlist/WatchlistTable';

const items = [
  {
    symbol: 'NVDA',
    company: 'NVIDIA Corporation',
    price: 142.18,
    changePercent: 2.41,
    marketCap: 3_420_000,
    dayLow: 138.02,
    dayHigh: 144.9,
    aiScore: 72,
  },
  {
    symbol: 'BRK.B',
    company: 'Berkshire Hathaway Inc. New Class B Depositary Receipt',
    price: 452.1,
    changePercent: -14.82,
    marketCap: 980_000,
    dayLow: 441.2,
    dayHigh: 468.4,
    aiScore: 41,
  },
  {
    symbol: 'A',
    company: 'Agilent Technologies, Inc.',
    price: 138.04,
    changePercent: 0,
    marketCap: 39_200,
    dayLow: 136.1,
    dayHigh: 139.4,
    aiScore: undefined,
  },
];

export default function PreviewWatchlist() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-title">Watchlist</h1>
        <p className="page-lede">Prices, daily moves, and the alert you set on each symbol.</p>
      </div>
      <WatchlistTable items={items} onAddAlert={() => undefined} />
      <section className="surface-card px-4 py-4">
        <h2 className="section-title">Alerts fired</h2>
        <p className="mt-2 text-sm text-ink-2">NVDA crossed 142.50, your upper level.</p>
        <p className="num mt-1 text-xs text-ink-3">Today, 14:32</p>
      </section>
    </div>
  );
}
