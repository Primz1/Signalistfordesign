'use client';

import WatchlistTable from '@/components/watchlist/WatchlistTable';
import { SpotlightCard } from '@/components/motion';
import { Bell, TrendingUp, Radar } from 'lucide-react';

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

const bullishCount = items.filter((i) => (i.aiScore ?? 0) >= 65).length;

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
        <p className="page-lede">Prices, daily moves, and the alert you set on each symbol.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SpotlightCard spotlightColor="lime" tilt className="p-5">
          <p className="label-sm flex items-center gap-2">
            <Radar className="size-3.5" strokeWidth={1.5} /> Tracked symbols
          </p>
          <p className="figure mt-2 text-[28px] text-ink">{items.length}</p>
        </SpotlightCard>
        <SpotlightCard spotlightColor="cyan" tilt className="p-5">
          <p className="label-sm flex items-center gap-2">
            <Bell className="size-3.5" strokeWidth={1.5} /> Active price channels
          </p>
          <p className="figure mt-2 text-[28px] text-ink">2</p>
        </SpotlightCard>
        <SpotlightCard spotlightColor="violet" tilt className="p-5">
          <p className="label-sm flex items-center gap-2">
            <TrendingUp className="size-3.5" strokeWidth={1.5} /> Bullish regime count
          </p>
          <p className="figure mt-2 text-[28px] text-violet">{bullishCount}</p>
        </SpotlightCard>
      </div>

      <WatchlistTable items={items} onAddAlert={() => undefined} />

      <SpotlightCard spotlightColor="cobalt" className="px-5 py-5">
        <h2 className="section-title">Alerts fired</h2>
        <div className="mt-4 flex flex-col gap-4">
          {ALERTS.map((a, i) => (
            <div key={`${a.symbol}-${i}`} className="flex gap-3">
              <span
                className={`mt-1 size-2 flex-none rounded-full ${
                  a.tone === 'up' ? 'bg-up shadow-[0_0_8px_var(--sg-up)]' : a.tone === 'down' ? 'bg-down shadow-[0_0_8px_var(--sg-down)]' : 'bg-cyan shadow-[0_0_8px_var(--sg-cyan)]'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm leading-normal text-ink-2">
                  <span className="num font-semibold text-ink">{a.symbol}</span> {a.message}
                </p>
                <p className="num mt-0.5 text-xs text-ink-3">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </SpotlightCard>
    </div>
  );
}
