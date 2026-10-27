import Link from 'next/link';

const rows = [
  { symbol: 'NVDA', company: 'NVIDIA Corporation', price: '$142.18', change: '+2.41%', up: true, score: '72' },
  { symbol: 'AAPL', company: 'Apple Inc.', price: '$228.40', change: '−0.62%', up: false, score: '61' },
  {
    symbol: 'BRK.B',
    company: 'Berkshire Hathaway Inc. New Class B Depositary',
    price: '$452.10',
    change: '−14.82%',
    up: false,
    score: '48',
  },
  { symbol: 'MSFT', company: 'Microsoft Corporation', price: '$418.02', change: '+0.18%', up: true, score: '—' },
];

export default function PreviewDashboard() {
  return (
    <div className="flex flex-col gap-12">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
        <div>
          <p className="text-base text-ink-2">Good afternoon, Aleksandra</p>
          <h1 className="label-sm mt-6">Paper portfolio value</h1>
          <div className="figure mt-1 text-[32px] text-ink md:text-[48px]">$128,420.18</div>
          <div className="num mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            <span className="text-up">+$1,842.10 (+1.46%) today</span>
            <span className="text-down">−$4,210.00 (−3.17%) all time</span>
          </div>
          <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
            {[
              ['Cash', '$42,180.00'],
              ['Invested', '$86,240.18'],
              ['Positions', '4'],
            ].map(([k, v]) => (
              <div key={k} className="min-w-0 bg-canvas px-4 py-3">
                <dt className="label-sm">{k}</dt>
                <dd className="num mt-1 truncate text-base text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/preview/watchlist" className="yellow-btn">
              Add symbol
            </Link>
            <Link href="/preview/watchlist" className="ghost-btn">
              New alert
            </Link>
          </div>
        </div>
        <div className="surface-card flex min-h-[280px] flex-col justify-between p-4">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span className="num text-sm font-semibold text-ink">NVDA</span>
              <span className="ml-2 text-sm text-ink-3">Largest position</span>
            </div>
            <Link href="/preview/stock" className="text-sm font-semibold text-ink hover:underline">
              Open chart
            </Link>
          </div>
          <div className="num text-[32px] font-semibold tracking-[-0.03em] text-ink">$142.18</div>
          <p className="text-sm text-ink-3">Sample series. Live charts load from the market feed.</p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="section-title">Your watchlist</h2>
          <Link href="/preview/watchlist" className="text-sm text-ink-2 hover:text-ink">
            Open watchlist
          </Link>
        </div>
        <div className="surface-card">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b border-line">
                {['Symbol', 'Price', 'Today', 'AI score'].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase ${h === 'Symbol' ? 'text-left' : 'text-right'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.symbol} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="max-w-0 px-4 py-3">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="num shrink-0 font-semibold text-ink">{row.symbol}</span>
                      <span className="min-w-0 truncate text-sm text-ink-3" title={row.company}>
                        {row.company}
                      </span>
                    </div>
                  </td>
                  <td className="num px-4 py-3 text-right text-ink">{row.price}</td>
                  <td className={`num px-4 py-3 text-right ${row.up ? 'text-up' : 'text-down'}`}>{row.change}</td>
                  <td className="num px-4 py-3 text-right text-ink">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
