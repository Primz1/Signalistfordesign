'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2 } from 'lucide-react';
import CandlestickChart, { type IndicatorToggleKey } from './CandlestickChart';
import { IndicatorGuide, type ExtraIndicators } from './IndicatorGuide';
import SignalBadges from './SignalBadges';
import WatchlistButton from '@/components/watchlist/WatchlistButton';
import { getExtraIndicators } from '@/lib/actions/ai.actions';
import { getChartData } from '@/lib/actions/market.actions';
import { CHART_RANGES, type ChartRange } from '@/lib/market/ohlcv';
import { cn } from '@/lib/utils';
import { SpotlightCard, CountUp } from '@/components/motion';

type ChartPayload = Awaited<ReturnType<typeof getChartData>>;

type StockChartSectionProps = {
  symbol: string;
  company: string;
  exchange?: string;
  logo?: string;
  isInWatchlist: boolean;
  chartData: ChartPayload;
  aiSummary?: string | null;
  aiScore?: number | null;
};

const TOGGLES: IndicatorToggleKey[] = ['SMA20', 'SMA50', 'RSI', 'MACD', 'BB'];

function formatVol(n?: number) {
  if (n == null || !Number.isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}

function initials(name: string, symbol: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return symbol.slice(0, 2).toUpperCase();
}

function clamp01to100(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

type Factor = { label: string; score: number; color: string };

/** Derives a 4-factor AI decomposition strip from the technical indicators already on hand. */
function deriveFactors(
  indicators: ChartPayload['indicators'],
  extras: { adx?: number | null } | null
): Factor[] {
  if (!indicators) return [];
  const { sma20, sma50, rsi14, macd, bollinger } = indicators;

  const trendSpread = sma50 !== 0 ? ((sma20 - sma50) / Math.abs(sma50)) * 100 : 0;
  const trend = clamp01to100(50 + trendSpread * 6);

  const momentum = clamp01to100(rsi14);

  const bandWidth = bollinger.upper - bollinger.lower;
  const macdScale = bandWidth > 0 ? (macd.histogram / bandWidth) * 100 : 0;
  const macdScore = clamp01to100(50 + macdScale * 4);

  const conviction = extras?.adx != null ? clamp01to100(extras.adx) : clamp01to100(50 + Math.abs(trendSpread) * 4);

  return [
    { label: 'Trend', score: trend, color: 'var(--sg-cobalt)' },
    { label: 'Momentum', score: momentum, color: 'var(--sg-cyan)' },
    { label: 'MACD impulse', score: macdScore, color: 'var(--sg-signal)' },
    { label: 'Conviction', score: conviction, color: 'var(--sg-violet)' },
  ];
}

export default function StockChartSection({
  symbol,
  company,
  exchange,
  logo,
  isInWatchlist,
  chartData: initial,
  aiSummary,
  aiScore,
}: StockChartSectionProps) {
  const [range, setRange] = useState<ChartRange>((initial.range as ChartRange) || '1D');
  const [chartData, setChartData] = useState(initial);
  const [overlays, setOverlays] = useState<Record<IndicatorToggleKey, boolean>>({
    SMA20: true,
    SMA50: false,
    RSI: false,
    MACD: false,
    BB: false,
  });
  const [pending, startTransition] = useTransition();
  const [chartEpoch, setChartEpoch] = useState(0);
  const requestId = useRef(0);
  const [extras, setExtras] = useState<ExtraIndicators | null>(null);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    setChartData(initial);
    setRange((initial.range as ChartRange) || '1D');
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    getExtraIndicators(symbol).then((res) => {
      if (cancelled) return;
      if (res.success && res.data?.latest) setExtras(res.data.latest);
      else setExtras(null);
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const price = chartData.quote?.price;
  const changePct = chartData.quote?.changePercent;
  const change = chartData.quote?.change;
  const up = (changePct ?? 0) >= 0;
  const last = chartData.candles[chartData.candles.length - 1];

  const open = chartData.quote?.open ?? last?.open;
  const high = chartData.quote?.high ?? last?.high;
  const low = chartData.quote?.low ?? last?.low;
  const close = price ?? last?.close;
  const vol = chartData.quote?.volume ?? last?.volume;

  const loadRange = (next: ChartRange) => {
    if (next === range) return;
    setRange(next);
    const id = ++requestId.current;
    startTransition(async () => {
      try {
        const data = await getChartData(symbol, next);
        // Ignore stale responses if user clicked another range quickly
        if (id !== requestId.current) return;
        setChartData(data);
        setRange(data.range as ChartRange);
        setChartEpoch((e) => e + 1);
      } catch {
        if (id !== requestId.current) return;
        // keep prior candles; tab still shows selection
      }
    });
  };

  const toggleOverlay = (key: IndicatorToggleKey) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const factors = deriveFactors(chartData.indicators, extras);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <SpotlightCard spotlightColor="cobalt" className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-start md:p-6">
        <div>
          <div className="mb-4 flex min-w-0 flex-wrap items-center gap-3">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                onLoad={() => setLogoReady(true)}
                className={cn(
                  'size-12 shrink-0 rounded-lg bg-surface-2 object-contain p-1 transition-[filter] duration-150',
                  logoReady ? 'blur-0' : 'blur-sm'
                )}
              />
            ) : (
              <div className="num flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-sm font-semibold text-ink">
                {initials(company, symbol)}
              </div>
            )}
            <h1 className="page-title min-w-0 break-words">{company}</h1>
            <span className="num text-sm text-ink-2">({symbol})</span>
            {exchange ? (
              <span className="rounded-lg border border-line-strong px-2 py-1 text-xs text-ink-3">
                {exchange.split(/[\s/-]/)[0] || exchange}
              </span>
            ) : null}
          </div>

          <div className="mb-3 flex flex-wrap items-baseline gap-3">
            {price != null ? (
              <CountUp value={price} decimals={2} prefix="$" className="figure block text-[32px] text-ink md:text-[48px]" />
            ) : null}
            {changePct != null ? (
              <span
                className={cn(
                  'num rounded-full px-2.5 py-1 text-sm font-semibold',
                  up ? 'bg-up/15 text-up' : 'bg-down/15 text-down'
                )}
              >
                {change != null
                  ? `${up ? '+' : '−'}${Math.abs(change).toFixed(2)} (${up ? '+' : '−'}${Math.abs(changePct).toFixed(2)}% today)`
                  : `${up ? '+' : '−'}${Math.abs(changePct).toFixed(2)}% today`}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ['O', open],
              ['H', high],
              ['L', low],
              ['C', close],
            ].map(([label, v]) => (
              <span
                key={label}
                className="num concentric border border-[var(--sg-border-specular)] bg-[var(--sg-glass-hover)] px-2 py-1 text-xs text-ink-2"
              >
                <span className="text-ink-3">{label}</span> {v != null ? (v as number).toFixed(2) : '—'}
              </span>
            ))}
            <span className="num concentric border border-[var(--sg-border-specular)] bg-[var(--sg-glass-hover)] px-2 py-1 text-xs text-ink-2">
              <span className="text-ink-3">Vol</span> {formatVol(vol)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          {aiScore != null && Number.isFinite(aiScore) ? (
            <span
              className="num text-sm text-ink-2"
            >
              AI score{' '}
              <span className={aiScore >= 60 ? 'text-up' : aiScore >= 40 ? 'text-ink' : 'text-down'}>
                {Math.round(aiScore)}
              </span>
              <span className="text-ink-3">/100</span>
            </span>
          ) : null}
          <WatchlistButton
            symbol={symbol}
            company={company}
            isInWatchlist={isInWatchlist}
            variant="outline"
            showTrashIcon
          />
        </div>
      </SpotlightCard>

      <SignalBadges signals={chartData.signals} />

      {/* Chart */}
      <SpotlightCard spotlightColor="cyan" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sg-border-specular)] px-4 py-3">
          <div className="concentric flex flex-wrap gap-1 border border-line bg-canvas p-1" role="group" aria-label="Chart range">
            {CHART_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => loadRange(r)}
                aria-pressed={range === r}
                className={cn(
                  'num press h-11 rounded-lg px-3 text-sm',
                  range === r
                    ? 'bg-surface-2 font-semibold text-ink'
                    : 'bg-transparent text-ink-2 hover:text-ink'
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {TOGGLES.map((key) => {
              const on = overlays[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleOverlay(key)}
                  aria-pressed={on}
                  className={cn(
                    'press h-11 rounded-lg border px-3 text-xs font-semibold tracking-[0.04em]',
                    on
                      ? 'border-line-strong bg-surface-2 text-ink'
                      : 'border-line text-ink-3 hover:text-ink'
                  )}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative p-4">
          {pending ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70">
              <Loader2 className="size-5 animate-spin text-signal" />
            </div>
          ) : null}
          <CandlestickChart
            key={`${symbol}-${range}-${chartEpoch}-${chartData.candles.length}-${chartData.candles[0]?.time ?? 0}-${chartData.candles.at(-1)?.time ?? 0}`}
            data={{
              candles: chartData.candles,
              indicators: chartData.indicators,
            }}
            overlays={overlays}
            height={360}
          />
        </div>
      </SpotlightCard>

      {chartData.indicators ? (
        <IndicatorGuide indicators={chartData.indicators} price={price} extras={extras} />
      ) : null}

      {/* AI analysis */}
      <SpotlightCard spotlightColor="violet" className="mb-6 p-4 md:p-6">
        <h2 className="section-title mb-3">AI analysis</h2>
        <p className="mb-4 max-w-[72ch] text-base leading-normal text-ink">
          {aiSummary ||
            (chartData.indicators
              ? `${company} shows ${
                  chartData.indicators.sma20 >= chartData.indicators.sma50
                    ? 'price holding above the longer moving average'
                    : 'price below the longer moving average'
                } with RSI at ${chartData.indicators.rsi14.toFixed(0)}. MACD histogram is ${
                  chartData.indicators.macd.histogram >= 0 ? 'positive' : 'negative'
                }. Run full research for a deeper thesis.`
              : 'Insufficient market data for analysis.')}
        </p>

        {factors.length > 0 ? (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {factors.map((f) => (
              <div key={f.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="label-sm">{f.label}</span>
                  <span className="num font-semibold text-ink-2">{f.score}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${f.score}%`, backgroundColor: f.color, boxShadow: `0 0 10px ${f.color}` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <Link
          href={`/research?symbol=${symbol}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          Run full AI research on {symbol}
          <ExternalLink className="size-3.5" strokeWidth={1.5} />
        </Link>
      </SpotlightCard>
    </div>
  );
}
