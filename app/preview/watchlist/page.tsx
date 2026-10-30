'use client';

import WatchlistTable from '@/components/watchlist/WatchlistTable';
import { Bell } from 'lucide-react';

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

const ALERTS = [
  { symbol: 'NVDA', message: 'crossed 142.50, your upper level.', time: 'Today, 14:32', tone: 'up' as const },
  { symbol: 'BRK.B', message: 'fell below 460.00, your lower level.', time: 'Today, 09:05', tone: 'down' as const },
  { symbol: 'A', message: 'AI score upgraded from 58 to 61.', time: 'Yesterday, 18:47', tone: 'neutral' as const },
];

export default function PreviewWatchlist() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="page-title">Watchlist</h1>
        <p className="page-lede">
          {items.length} symbols · 2 alerts
        </p>
      </div>

      <WatchlistTable items={items} onAddAlert={() => undefined} />

      <div>
        <h2 className="section-title mb-4">Alerts fired</h2>
        <div className="flex flex-col divide-y divide-line">
          {ALERTS.map((a, i) => (
            <div key={`${a.symbol}-${i}`} className="flex items-start gap-3 py-3">
              <Bell className="mt-0.5 size-3.5 flex-none text-ink-3" strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="text-sm leading-normal text-ink-2">
                  <span className="num font-semibold text-ink">{a.symbol}</span> {a.message}
                </p>
                <p className="num mt-0.5 text-xs text-ink-3">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
