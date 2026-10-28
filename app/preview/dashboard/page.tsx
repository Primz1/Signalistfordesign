'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { SpotlightCard, CountUp, SplitText, MagneticButton } from '@/components/motion';
import { Sparkline } from '@/components/charts/Sparkline';

const NET_LIQ_SERIES = [124_180, 125_020, 124_640, 126_310, 127_140, 126_780, 127_980, 128_420.18];
const ALPHA_SERIES = [0.2, 0.6, 0.1, 0.9, 1.1, 0.8, 1.3, 1.46];

const ALLOCATION = [
  { label: 'Equities', pct: 58, color: 'var(--sg-cobalt)' },
  { label: 'High-conviction', pct: 9, color: 'var(--sg-signal)' },
  { label: 'Cash', pct: 33, color: 'var(--sg-cyan)' },
];

const SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'BRK.B'] as const;
type Symbol = (typeof SYMBOLS)[number];
const TIMEFRAMES = ['1D', '1W', '1M', '1Y', 'ALL'] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

const THESIS: Record<Symbol, string> = {
  NVDA: 'Price holding above both moving averages with RSI in the upper band. AI model reads continued institutional accumulation into the print.',
  AAPL: 'Range-bound into earnings. MACD histogram flattening — model is waiting for a volume confirmation before adding conviction.',
  MSFT: 'Slow grind higher on low realized volatility. Cloud segment momentum keeps the AI regime score anchored bullish.',
  'BRK.B': 'Drawdown driven by sector rotation, not fundamentals. Model flags this as a mean-reversion candidate on the 1M horizon.',
};

const POINTS_FOR: Record<Timeframe, number> = { '1D': 24, '1W': 7, '1M': 30, '1Y': 24, ALL: 36 };

function genSeries(seed: number, points: number) {
  let v = 100 + seed * 11;
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    v += Math.sin((i + seed) / 5.2) * 1.7 + Math.sin(seed * 1.3 + i * 0.41) * 0.9;
    out.push(Math.max(8, v));
  }
  return out;
}

function genVolume(seed: number, points: number) {
  const out: number[] = [];
  for (let i = 0; i < points; i++) {
    out.push(0.3 + Math.abs(Math.sin(seed * 2.1 + i * 0.6)) * 0.7);
  }
  return out;
}

const CHART_W = 920;
const CHART_H = 220;
const VOL_H = 44;

export default function PreviewDashboard() {
  const [symbol, setSymbol] = useState<Symbol>('NVDA');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const seedIndex = SYMBOLS.indexOf(symbol);
  const points = POINTS_FOR[timeframe];

  const { price, volume, pathPrice, pathBaseline, last, changePct } = useMemo(() => {
    const price = genSeries(seedIndex + 1, points);
    const baseline = genSeries(0.4, points).map((v, i) => v * 0.92 + price[0] * 0.08 - i * 0.02);
    const volume = genVolume(seedIndex + 1, points);

    const min = Math.min(...price, ...baseline);
    const max = Math.max(...price, ...baseline);
    const range = max - min || 1;
    const stepX = CHART_W / (points - 1 || 1);

    const toPath = (series: number[]) =>
      series
        .map((v, i) => {
          const x = i * stepX;
          const y = CHART_H - ((v - min) / range) * CHART_H;
          return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    const last = price[price.length - 1];
    const first = price[0];
    const changePct = ((last - first) / first) * 100;

    return {
      price,
      baseline,
      volume,
      pathPrice: toPath(price),
      pathBaseline: toPath(baseline),
      last,
      changePct,
      min,
      range,
    };
  }, [seedIndex, points]);

  const stepX = CHART_W / (points - 1 || 1);
  const hoverValue = hoverIdx != null ? price[hoverIdx] : null;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="text-base text-ink-2">Good afternoon, Aleksandra</p>
        <SplitText
          as="h1"
          text="Your paper book, live."
          className="font-display mt-2 text-[32px] leading-[1.05] tracking-[-0.03em] text-ink md:text-[40px]"
        />
      </div>

      {/* KPI Bento Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SpotlightCard spotlightColor="lime" tilt className="p-5">
          <p className="label-sm">Net liquidating value</p>
          <CountUp
            value={128_420.18}
            decimals={2}
            prefix="$"
            className="figure mt-2 block text-[30px] text-ink"
          />
          <span className="num mt-2 inline-flex items-center rounded-full bg-[var(--sg-up)]/15 px-2.5 py-1 text-xs font-semibold text-up">
            +$1,842.10 (+1.46%) today
          </span>
          <div className="mt-4 h-10">
            <Sparkline id="kpi-netliq" values={NET_LIQ_SERIES} color="var(--sg-signal)" width={200} height={40} className="h-10 w-full" />
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="cyan" tilt className="p-5">
          <p className="label-sm">Session alpha · day P&L</p>
          <CountUp value={1842.1} decimals={2} prefix="+$" className="figure mt-2 block text-[30px] text-ink" />
          <p className="num mt-2 text-xs text-ink-2">
            <span className="text-up">+1.46%</span> vs SPY <span className="text-ink-3">+0.62%</span>
          </p>
          <div className="mt-4 h-10">
            <Sparkline id="kpi-alpha" values={ALPHA_SERIES} color="var(--sg-cyan)" width={200} height={40} className="h-10 w-full" />
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="cobalt" tilt className="p-5">
          <p className="label-sm">Deployed capital &amp; cash</p>
          <p className="num mt-2 text-[18px] font-semibold text-ink">$86,240.18 invested</p>
          <p className="num text-xs text-ink-3">$42,180.00 cash</p>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
            {ALLOCATION.map((seg) => (
              <span
                key={seg.label}
                style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                title={`${seg.label} ${seg.pct}%`}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-3">
            {ALLOCATION.map((seg) => (
              <span key={seg.label} className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: seg.color }} />
                {seg.label} {seg.pct}%
              </span>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard spotlightColor="violet" tilt className="p-5">
          <p className="label-sm">AI regime conviction</p>
          <p className="num mt-2 text-[30px] font-semibold text-violet">
            82<span className="text-base font-normal text-ink-3">/100</span>
          </p>
          <p className="text-xs text-ink-2">Bullish expansion</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-violet" style={{ width: '82%', boxShadow: '0 0 12px var(--sg-violet)' }} />
          </div>
          <p className="num mt-2 text-[11px] text-ink-3">14 active signals</p>
        </SpotlightCard>
      </div>

      {/* Interactive Position & Telemetry Stage */}
      <SpotlightCard spotlightColor="cyan" className="p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-baseline gap-2">
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSymbol(s)}
                  className={`num press h-9 rounded-lg px-3 text-sm font-semibold transition-colors ${
                    symbol === s ? 'bg-signal text-signal-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="num mt-3 flex items-baseline gap-3">
              <span className="figure text-[26px] text-ink">
                {hoverValue != null ? hoverValue.toFixed(2) : last.toFixed(2)}
              </span>
              <span className={`text-sm ${changePct >= 0 ? 'text-up' : 'text-down'}`}>
                {changePct >= 0 ? '+' : ''}
                {changePct.toFixed(2)}% · {timeframe}
              </span>
            </div>
          </div>

          <div className="concentric flex gap-1 border border-line bg-canvas p-1">
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                aria-pressed={timeframe === t}
                className={`num press h-9 rounded-lg px-2.5 text-xs font-semibold ${
                  timeframe === t ? 'bg-surface-2 text-ink' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div
          className="relative mt-5 touch-none select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            setHoverIdx(Math.round(frac * (points - 1)));
          }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} preserveAspectRatio="none" className="h-[220px] w-full">
            <defs>
              <linearGradient id="dash-price-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--sg-cyan)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--sg-cyan)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`${pathBaseline}`} fill="none" stroke="var(--sg-signal)" strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <path d={`${pathPrice} L${CHART_W},${CHART_H} L0,${CHART_H} Z`} fill="url(#dash-price-grad)" stroke="none" />
            <path d={pathPrice} fill="none" stroke="var(--sg-cyan)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            {hoverIdx != null && (
              <line
                x1={hoverIdx * stepX}
                x2={hoverIdx * stepX}
                y1={0}
                y2={CHART_H}
                stroke="var(--sg-ink-3)"
                strokeWidth={1}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          <svg viewBox={`0 0 ${CHART_W} ${VOL_H}`} preserveAspectRatio="none" className="h-11 w-full">
            {volume.map((v, i) => (
              <rect
                key={i}
                x={Number((i * stepX).toFixed(2))}
                y={Number((VOL_H - v * VOL_H).toFixed(2))}
                width={Math.max(1.5, stepX * 0.6)}
                height={Number((v * VOL_H).toFixed(2))}
                fill={price[i] >= (price[i - 1] ?? price[i]) ? 'var(--sg-up)' : 'var(--sg-down)'}
                opacity={hoverIdx === i ? 1 : 0.45}
              />
            ))}
          </svg>
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--sg-border-specular)] bg-[var(--sg-glass-hover)] p-4">
          <span className="num mt-0.5 shrink-0 rounded-full bg-violet/15 px-2 py-0.5 text-[11px] font-semibold text-violet">AI thesis</span>
          <p className="text-sm leading-normal text-ink-2">{THESIS[symbol]}</p>
        </div>
      </SpotlightCard>

      <div className="flex flex-wrap gap-3">
        <MagneticButton>
          <Link href="/preview/watchlist" className="yellow-btn">
            Add symbol
          </Link>
        </MagneticButton>
        <Link href="/preview/stock" className="ghost-btn">
          Open full chart
        </Link>
      </div>
    </div>
  );
}
