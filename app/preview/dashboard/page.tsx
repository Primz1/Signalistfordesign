'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CountUp, Reveal } from '@/components/motion';
import { PortfolioHeroChart, type ChartPoint, type ChartRangeKey } from '@/components/dashboard/PortfolioHeroChart';
import { deterministicSeries } from '@/lib/charts/deterministic-series';
import { formatPrice, formatSignedPrice } from '@/lib/utils';

const WATCHLIST = [
  { symbol: 'NVDA', company: 'NVIDIA Corporation', price: 142.18, changePct: 2.41 },
  { symbol: 'AAPL', company: 'Apple Inc.', price: 228.52, changePct: -0.64 },
  { symbol: 'MSFT', company: 'Microsoft Corporation', price: 417.3, changePct: 0.82 },
  { symbol: 'BRK.B', company: 'Berkshire Hathaway Inc. Class B', price: 452.1, changePct: -1.82 },
];

const RESEARCH = [
  {
    symbol: 'NVDA',
    confidence: 82,
    summary:
      'Price holding above both moving averages with RSI in the upper band. Model reads continued institutional accumulation into the print.',
  },
  {
    symbol: 'AAPL',
    confidence: 64,
    summary:
      'Range-bound into earnings. MACD histogram flattening — waiting for a volume confirmation before adding conviction.',
  },
  {
    symbol: 'MSFT',
    confidence: 77,
    summary: 'Slow grind higher on low realized volatility. Cloud segment momentum keeps the regime score bullish.',
  },
];

const POINTS_FOR: Record<ChartRangeKey, number> = { '1D': 24, '1W': 7, '1M': 30, '1Y': 24 };

export default function PreviewDashboard() {
  const totalValue = 128_420.18;
  const dayPl = 1842.1;
  const dayPlPercent = 1.46;
  const cash = 42_180.0;
  const invested = 86_240.18;

  // Derived so every range's series ends exactly at totalValue — the hero
  // chart never disagrees with the number above it.
  const seriesByRange = useMemo(() => {
    const scale: Record<ChartRangeKey, number> = { '1D': 1, '1W': 2.2, '1M': 5, '1Y': 14 };
    const out: Record<ChartRangeKey, ChartPoint[]> = { '1D': [], '1W': [], '1M': [], '1Y': [] };
    (Object.keys(POINTS_FOR) as ChartRangeKey[]).forEach((r) => {
      out[r] = deterministicSeries(`preview-${r}`, POINTS_FOR[r], totalValue, dayPlPercent * scale[r]).map(
        (close, i) => ({ time: i, close })
      );
    });
    return out;
  }, [totalValue, dayPlPercent]);

  return (
    <div className="flex flex-col gap-16 pb-16">
      <div className="flex flex-col gap-6">
        <p className="text-[15px] text-ink-2">
          Good afternoon, Aleksandra <span className="text-ink-3">·</span>{' '}
          <span className="text-ink-3">Markets open</span>
        </p>

        <Reveal className="flex flex-col gap-10" stagger={0.08}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <CountUp
                value={totalValue}
                decimals={2}
                prefix="$"
                className="figure block text-[clamp(40px,11vw,64px)] leading-[1] text-ink"
              />
              <p className="num mt-2 text-[15px] text-up">
                {formatSignedPrice(dayPl)} (+{dayPlPercent.toFixed(2)}%) today
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <Link href="/preview/watchlist" className="yellow-btn">
                Add symbol
              </Link>
              <Link href="/preview/watchlist" className="text-btn">
                New alert
              </Link>
              <Link href="/preview/stock" className="text-btn">
                Run research
              </Link>
            </div>
          </div>

          <PortfolioHeroChart seriesByRange={seriesByRange} className="-mt-4" />

          <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:gap-x-12 sm:gap-y-5">
            <div className="min-w-0">
              <p className="meta truncate">Day P&amp;L</p>
              <p className="num mt-1 truncate text-[17px] font-semibold text-up sm:text-xl">
                {formatSignedPrice(dayPl)}
              </p>
              <p className="num truncate text-xs text-up">+{dayPlPercent.toFixed(2)}%</p>
            </div>
            <div className="min-w-0">
              <p className="meta truncate">Cash</p>
              <p className="num mt-1 truncate text-[17px] font-semibold text-ink sm:text-xl">{formatPrice(cash)}</p>
            </div>
            <div className="min-w-0">
              <p className="meta truncate">Invested</p>
              <p className="num mt-1 truncate text-[17px] font-semibold text-ink sm:text-xl">{formatPrice(invested)}</p>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal className="grid gap-16 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" stagger={0.08}>
        <div className="min-w-0">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="section-title">Watchlist</h2>
            <Link href="/preview/watchlist" className="text-sm text-ink-2 hover:text-ink">
              Open watchlist
            </Link>
          </div>
          <table className="w-full table-fixed text-sm">
            <tbody>
              {WATCHLIST.map((row) => (
                <tr key={row.symbol} className="border-b border-line last:border-0">
                  <td className="w-[48%] py-3.5 sm:w-auto">
                    <Link href="/preview/stock" className="flex min-w-0 items-baseline gap-2">
                      <span className="num shrink-0 font-semibold text-ink">{row.symbol}</span>
                      <span
                        className="hidden min-w-0 truncate text-ink-3 min-[420px]:inline"
                        title={row.company}
                      >
                        {row.company}
                      </span>
                    </Link>
                  </td>
                  <td className="num w-[26%] py-3.5 text-right text-ink sm:w-auto">{formatPrice(row.price)}</td>
                  <td
                    className={`num w-[26%] py-3.5 pl-4 text-right sm:w-auto ${row.changePct >= 0 ? 'text-up' : 'text-down'}`}
                  >
                    {row.changePct >= 0 ? '+' : ''}
                    {row.changePct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="min-w-0">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="section-title">Research</h2>
            <Link href="/preview/stock" className="text-sm text-ink-2 hover:text-ink">
              New report
            </Link>
          </div>
          <ul>
            {RESEARCH.map((r) => (
              <li key={r.symbol} className="border-b border-line py-3.5 last:border-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="num text-sm font-semibold text-ink">{r.symbol}</span>
                  <span className="num text-xs text-ink-3">{r.confidence}% confidence</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-normal text-ink-2">{r.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
