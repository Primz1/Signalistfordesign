import Link from 'next/link';
import { getCachedSession } from '@/lib/auth/session';
import { getPortfolio } from '@/lib/actions/portfolio.actions';
import { listWatchlist } from '@/lib/actions/watchlist.actions';
import { fetchJSON, searchStocks } from '@/lib/actions/finnhub.actions';
import { connectToDatabase } from '@/database/mongoose';
import { StockScoreModel } from '@/database/models/stockScore.model';
import { AiReportModel } from '@/database/models/aiReport.model';
import { formatPrice } from '@/lib/utils';
import TickerTape from '@/components/dashboard/TickerTape';
import { SearchCommand } from '@/components/search/SearchCommand';
import TradingViewWidget from '@/components/market/TradingViewWidget';
import { PageEnter } from '@/components/ui/motion';
import { getEconomicCalendarEvents } from '@/lib/actions/economic.actions';
import { EconomicCalendar } from '@/components/ui/economic-calendar';
import { SpotlightCard, CountUp } from '@/components/motion';
import { Sparkline } from '@/components/charts/Sparkline';
import { deterministicSeries } from '@/lib/charts/deterministic-series';
import {
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
  MINI_CHART_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
} from '@/lib/constants';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const token = () => process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

const TAPE_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'AMD'];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const scriptUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

export default async function Home() {
  const session = await getCachedSession();
  const firstName = session?.user?.name?.split(/\s+/)[0] || 'Trader';

  const [portfolioRes, watchlistRes, initialStocks] = await Promise.all([
    getPortfolio(),
    listWatchlist(),
    searchStocks(),
  ]);

  const portfolio = portfolioRes.success ? portfolioRes.data : null;
  const watchlist = watchlistRes.success
    ? watchlistRes.data.map((w) => ({
        symbol: String(w.symbol),
        company: String(w.company),
      }))
    : [];

  await connectToDatabase();
  const symbols = watchlist.map((w) => w.symbol.toUpperCase()).slice(0, 6);
  const [scores, reports, ecoEvents] = await Promise.all([
    symbols.length
      ? StockScoreModel.find({ symbol: { $in: symbols } }).select('symbol score').lean()
      : Promise.resolve([]),
    AiReportModel.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('symbol summary confidence createdAt')
      .lean(),
    getEconomicCalendarEvents(),
  ]);

  const scoreMap = new Map(
    (scores as { symbol: string; score: number }[]).map((s) => [s.symbol.toUpperCase(), s.score])
  );

  const quoteSymbols = Array.from(
    new Set([...TAPE_SYMBOLS, ...symbols, 'NVDA', 'SPY'].map((s) => s.toUpperCase()))
  );

  const quotes = await Promise.all(
    quoteSymbols.map(async (sym) => {
      try {
        const q = await fetchJSON<{ c?: number; dp?: number }>(
          `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(sym)}&token=${token()}`
        );
        return { symbol: sym, price: q?.c, change: q?.dp };
      } catch {
        return { symbol: sym, price: undefined, change: undefined };
      }
    })
  );
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));
  const spyChangePct = quoteMap.get('SPY')?.change ?? null;

  const tapeItems = quotes
    .filter((q) => q.price != null)
    .slice(0, 8)
    .map((q) => ({
      symbol: q.symbol,
      price: formatPrice(q.price!),
      change: `${(q.change ?? 0) >= 0 ? '+' : ''}${(q.change ?? 0).toFixed(2)}%`,
      up: (q.change ?? 0) >= 0,
    }));

  const cash = Number(portfolio?.cash ?? 10000);
  const totalValue = Number(portfolio?.totalValue ?? 0) || cash;
  const plTotal = Number(portfolio?.plTotal ?? 0);
  const plPercent = Number(portfolio?.plPercent ?? 0);
  const dayPl = Number((portfolio as { dayPl?: number } | null)?.dayPl ?? 0);
  const dayPlPercent = Number((portfolio as { dayPlPercent?: number } | null)?.dayPlPercent ?? 0);
  const holdingsCount = (portfolio?.holdings as unknown[] | undefined)?.length ?? 0;
  const invested = Math.max(0, totalValue - cash);
  const investedPct = totalValue > 0 ? Math.round((invested / totalValue) * 100) : 0;
  const cashPct = 100 - investedPct;

  const scoreValues = Array.from(scoreMap.values());
  const avgScore = scoreValues.length
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : null;
  const regimeLabel =
    avgScore == null
      ? 'Awaiting signals'
      : avgScore >= 70
        ? 'Bullish expansion'
        : avgScore >= 55
          ? 'Bullish'
          : avgScore >= 45
            ? 'Neutral'
            : avgScore >= 30
              ? 'Bearish'
              : 'Bearish contraction';

  const heroHolding = (portfolio?.holdings as { symbol: string; price?: number }[] | undefined)?.[0];
  const heroSym = (heroHolding?.symbol || watchlist[0]?.symbol || 'NVDA').toUpperCase();
  const heroQuote = quoteMap.get(heroSym);

  const typedReports = reports as {
    _id?: { toString(): string };
    symbol: string;
    query?: string;
    summary?: string;
    confidence?: number;
    createdAt?: string | Date;
  }[];

  return (
    <PageEnter className="flex flex-col">
      <TickerTape items={tapeItems} />

      <div className="flex flex-col gap-10">
        <div>
          <p className="text-[15px] text-ink-2">
            {greeting()}, {firstName}
          </p>
        </div>

        {/* KPI Bento Strip */}
        <section aria-label="Portfolio overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SpotlightCard spotlightColor="lime" tilt className="p-5">
            <p className="label-sm">Net liquidating value</p>
            <CountUp
              value={totalValue}
              decimals={2}
              prefix="$"
              className="figure mt-2 block text-[30px] text-ink"
            />
            <span
              className={`num mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                dayPl > 0 ? 'bg-up/15 text-up' : dayPl < 0 ? 'bg-down/15 text-down' : 'bg-surface-2 text-ink-2'
              }`}
            >
              {signed(dayPl)} ({signedPct(dayPlPercent)}) today
            </span>
            <p className={`num mt-1.5 text-xs ${plTotal > 0 ? 'text-up' : plTotal < 0 ? 'text-down' : 'text-ink-3'}`}>
              {signed(plTotal)} ({signedPct(plPercent)}) all time
            </p>
            <div className="mt-4 h-10">
              <Sparkline
                id="kpi-netliq"
                values={deterministicSeries('netliq', 8, totalValue, dayPlPercent)}
                color="var(--sg-signal)"
                width={200}
                height={40}
                className="h-10 w-full"
              />
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="cyan" tilt className="p-5">
            <p className="label-sm">Session alpha · day P&amp;L</p>
            <CountUp
              value={dayPl}
              decimals={2}
              prefix={dayPl >= 0 ? '+$' : '-$'}
              className="figure mt-2 block text-[30px] text-ink"
            />
            <p className="num mt-2 text-xs text-ink-2">
              <span className={dayPlPercent >= 0 ? 'text-up' : 'text-down'}>{signedPct(dayPlPercent)}</span>{' '}
              {spyChangePct != null ? (
                <>
                  vs SPY <span className="text-ink-3">{signedPct(spyChangePct)}</span>
                </>
              ) : (
                <span className="text-ink-3">vs SPY —</span>
              )}
            </p>
            <div className="mt-4 h-10">
              <Sparkline
                id="kpi-alpha"
                values={deterministicSeries('alpha', 8, dayPlPercent || 0.1, dayPlPercent)}
                color="var(--sg-cyan)"
                width={200}
                height={40}
                className="h-10 w-full"
              />
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="cobalt" tilt className="p-5">
            <p className="label-sm">Deployed capital &amp; cash</p>
            <p className="num mt-2 text-[18px] font-semibold text-ink">{formatPrice(invested)} invested</p>
            <p className="num text-xs text-ink-3">{formatPrice(cash)} cash</p>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
              <span style={{ width: `${investedPct}%`, backgroundColor: 'var(--sg-cobalt)' }} title={`Invested ${investedPct}%`} />
              <span style={{ width: `${cashPct}%`, backgroundColor: 'var(--sg-cyan)' }} title={`Cash ${cashPct}%`} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--sg-cobalt)' }} />
                Invested {investedPct}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--sg-cyan)' }} />
                Cash {cashPct}%
              </span>
              <span>· {holdingsCount} positions</span>
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="violet" tilt className="p-5">
            <p className="label-sm">AI regime conviction</p>
            <p className="num mt-2 text-[30px] font-semibold text-violet">
              {avgScore ?? '—'}
              <span className="text-base font-normal text-ink-3">/100</span>
            </p>
            <p className="text-xs text-ink-2">{regimeLabel}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-violet"
                style={{ width: `${avgScore ?? 0}%`, boxShadow: avgScore ? '0 0 12px var(--sg-violet)' : undefined }}
              />
            </div>
            <p className="num mt-2 text-[11px] text-ink-3">{scoreValues.length} active signals</p>
          </SpotlightCard>
        </section>

        <section
          aria-labelledby="account-heading"
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12"
        >
          <div className="flex flex-col">
            <h1 id="account-heading" className="sr-only">
              Paper portfolio value
            </h1>
            <div className="mt-6 flex flex-wrap gap-2">
              <SearchCommand
                renderAs="button"
                label="Add symbol"
                initialStocks={initialStocks}
                quickAddEnabled
                pill
                className="!w-auto !max-w-none !justify-center !border-transparent !bg-signal !px-4 !font-semibold !text-signal-ink hover:!bg-signal-hover"
              />
              <Link href="/watchlist" className="ghost-btn">
                New alert
              </Link>
              <Link href="/research" className="ghost-btn">
                Run research
              </Link>
            </div>
          </div>

          <SpotlightCard spotlightColor="cyan" className="flex min-h-[280px] flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--sg-border-specular)] px-4 py-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="num text-sm font-semibold text-ink">{heroSym}</span>
                <span className="truncate text-sm text-ink-3">
                  {heroHolding ? 'Largest position' : 'From your watchlist'} · 1 month
                </span>
                {heroQuote?.change != null ? (
                  <span className={`num rounded-full px-2 py-0.5 text-xs font-semibold ${heroQuote.change >= 0 ? 'bg-up/15 text-up' : 'bg-down/15 text-down'}`}>
                    {signedPct(heroQuote.change)}
                  </span>
                ) : null}
              </div>
              <Link
                href={`/stocks/${heroSym}`}
                className="flex-none text-sm font-semibold text-ink hover:underline"
              >
                Open chart
              </Link>
            </div>
            <div className="flex-1 px-2 pb-2">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}mini-symbol-overview.js`}
                config={MINI_CHART_WIDGET_CONFIG(heroSym)}
                height={230}
              />
            </div>
          </SpotlightCard>
        </section>

        {/* What to look at next: watchlist movers and the latest research */}
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="section-title">Your watchlist</h2>
              <Link href="/watchlist" className="text-sm text-ink-2 hover:text-ink">
                Open watchlist
              </Link>
            </div>
            <SpotlightCard spotlightColor="lime" className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--sg-border-specular)] text-left">
                    {['Symbol', 'Price', 'Today', '7D trend', 'AI score'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className={`px-4 py-3 text-xs font-semibold tracking-[0.04em] text-ink-3 uppercase ${h !== 'Symbol' ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {watchlist.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8">
                        <p className="text-sm text-ink">No symbols yet.</p>
                        <p className="mt-1 text-sm text-ink-3">
                          Add a ticker with Add symbol and its price, move and AI score show up
                          here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    watchlist.slice(0, 6).map((row) => {
                      const sym = row.symbol.toUpperCase();
                      const q = quoteMap.get(sym);
                      const ch = q?.change ?? 0;
                      const score = scoreMap.get(sym);
                      return (
                        <tr key={sym} className="border-b border-[var(--sg-border-specular)] last:border-0 hover:bg-[var(--sg-glass-hover)]">
                          <td className="px-4 py-3">
                            <Link href={`/stocks/${sym}`} className="flex min-w-0 items-baseline gap-2">
                              <span className="num shrink-0 font-semibold text-ink">{sym}</span>
                              <span className="min-w-0 truncate text-sm text-ink-3" title={row.company}>{row.company}</span>
                            </Link>
                          </td>
                          <td className="num px-4 py-3 text-right text-ink">
                            {q?.price != null ? formatPrice(q.price) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {q?.change != null ? (
                              <span className={`num inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ch >= 0 ? 'bg-up/15 text-up' : 'bg-down/15 text-down'}`}>
                                {signedPct(ch)}
                              </span>
                            ) : (
                              <span className="num text-ink-3">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {q?.price != null ? (
                              <Sparkline
                                id={`watch-${sym}`}
                                values={deterministicSeries(sym, 7, q.price, ch)}
                                color={ch >= 0 ? 'var(--sg-up)' : 'var(--sg-down)'}
                                width={80}
                                height={28}
                                className="ml-auto h-7 w-20"
                              />
                            ) : (
                              <span className="text-ink-3">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ScoreCell score={score} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </SpotlightCard>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="section-title">Latest research</h2>
              <Link href="/research" className="text-sm text-ink-2 hover:text-ink">
                New report
              </Link>
            </div>
            <SpotlightCard spotlightColor="violet" className="divide-y divide-[var(--sg-border-specular)]">
              {typedReports.length === 0 ? (
                <Link href="/research" className="block px-4 py-4 hover:bg-[var(--sg-glass-hover)]">
                  <div className="text-sm font-semibold text-ink">No reports yet</div>
                  <p className="mt-1 text-sm leading-normal text-ink-3">
                    Pick a symbol: Signalist computes the factors first, then writes a narrative
                    that only cites those numbers.
                  </p>
                </Link>
              ) : (
                typedReports.map((r, i) => {
                  const conf = Math.round((r.confidence ?? 0.7) * 100);
                  const key =
                    (r._id && String(r._id)) ||
                    `${r.symbol}-${r.createdAt ? new Date(r.createdAt).getTime() : i}-${i}`;
                  return (
                    <Link
                      key={key}
                      href={`/research?symbol=${r.symbol}`}
                      className="block px-4 py-3 hover:bg-[var(--sg-glass-hover)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="num text-sm font-semibold text-ink">{r.symbol}</span>
                        <span className="num text-xs text-ink-3">{conf}% confidence</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-violet" style={{ width: `${conf}%` }} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-normal text-ink-2">
                        {r.query || r.summary || 'Research report'}
                      </p>
                    </Link>
                  );
                })
              )}
            </SpotlightCard>
          </div>
        </section>

        <section>
          <EconomicCalendar events={ecoEvents} title="Economic calendar" seeAllHref="/research" />
        </section>

        {/* Markets: TradingView embeds */}
        <section aria-labelledby="markets-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="markets-heading" className="section-title">
              Markets
            </h2>
            <span className="text-sm text-ink-3">Delayed data via TradingView</span>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SpotlightCard spotlightColor="cobalt" className="min-h-[420px] p-2 xl:col-span-1">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}market-overview.js`}
                config={MARKET_OVERVIEW_WIDGET_CONFIG}
                height={400}
              />
            </SpotlightCard>
            <SpotlightCard spotlightColor="lime" className="min-h-[420px] p-2 xl:col-span-2">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}stock-heatmap.js`}
                config={HEATMAP_WIDGET_CONFIG}
                height={400}
              />
            </SpotlightCard>
            <SpotlightCard spotlightColor="violet" className="min-h-[420px] p-2 xl:col-span-1">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}timeline.js`}
                config={TOP_STORIES_WIDGET_CONFIG}
                height={400}
              />
            </SpotlightCard>
            <SpotlightCard spotlightColor="cyan" className="min-h-[420px] p-2 xl:col-span-2">
              <TradingViewWidget
                scriptUrl={`${scriptUrl}market-quotes.js`}
                config={MARKET_DATA_WIDGET_CONFIG}
                height={400}
              />
            </SpotlightCard>
          </div>
        </section>
      </div>
    </PageEnter>
  );
}

function signed(n: number) {
  return `${n >= 0 ? '+' : '−'}${formatPrice(Math.abs(n))}`;
}

function signedPct(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;
}

function ScoreCell({ score }: { score?: number }) {
  if (score == null) return <span className="num text-ink-3">—</span>;
  const tone = score >= 65 ? 'text-up' : score >= 45 ? 'text-ink' : 'text-down';
  const barColor = score >= 65 ? 'var(--sg-up)' : score >= 45 ? 'var(--sg-cyan)' : 'var(--sg-down)';
  return (
    <div className="inline-flex flex-col items-end gap-1">
      <span className={`num ${tone}`}>{Math.round(score)}</span>
      <div className="h-1 w-14 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${Math.round(score)}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
