'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Activity, Gauge, Zap } from 'lucide-react';
import { SpotlightCard, CountUp } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { Candle } from '@/lib/market/ohlcv';
import type { MarketingLiveData } from '@/lib/marketing/live-data';

type Timeframe = '1D' | '1W' | '1M' | '6M' | '1Y';
type ChartMode = 'candles' | 'area';

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '6M', '1Y'];
const TIMEFRAME_POINTS: Record<Timeframe, number> = { '1D': 48, '1W': 42, '1M': 30, '6M': 90, '1Y': 120 };
const TIMEFRAME_STEP_SECONDS: Record<Timeframe, number> = {
  '1D': 1800,
  '1W': 21600,
  '1M': 86400,
  '6M': 86400,
  '1Y': 86400,
};

const FALLBACK_SYMBOLS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'BTC', 'SPY'];
const FALLBACK_PRICES: Record<string, number> = {
  NVDA: 131.88,
  AAPL: 214.32,
  TSLA: 248.1,
  MSFT: 428.55,
  BTC: 67420,
  SPY: 548.12,
};

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function mulberry32(seed: number) {
  let s = seed;
  return function rand() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSymbolList(data: MarketingLiveData): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const q of [...data.watchlist, ...data.markets]) {
    if (!seen.has(q.symbol)) {
      seen.add(q.symbol);
      list.push(q.symbol);
    }
  }
  for (const sym of FALLBACK_SYMBOLS) {
    if (list.length >= 6) break;
    if (!seen.has(sym)) {
      seen.add(sym);
      list.push(sym);
    }
  }
  return list.slice(0, 6);
}

type CommandQuote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  up: boolean;
  aiScore: number;
};

function resolveQuote(symbol: string, data: MarketingLiveData): CommandQuote {
  const match = [...data.watchlist, ...data.markets].find((q) => q.symbol === symbol);
  const seed = hashSeed(symbol);
  const aiScore =
    symbol === data.hero.symbol && data.hero.aiScore != null
      ? data.hero.aiScore
      : 54 + (seed % 42);
  if (match) {
    return {
      symbol: match.symbol,
      name: match.name,
      price: match.priceNum,
      changePct: match.changePct,
      up: match.up,
      aiScore,
    };
  }
  const rand = mulberry32(seed);
  const base = FALLBACK_PRICES[symbol] ?? 40 + (seed % 380);
  const changePct = (rand() - 0.42) * 6;
  return {
    symbol,
    name: symbol,
    price: base,
    changePct,
    up: changePct >= 0,
    aiScore,
  };
}

function generateCandles(symbol: string, timeframe: Timeframe, basePrice: number, trendUp: boolean): Candle[] {
  const rand = mulberry32(hashSeed(`${symbol}:${timeframe}`));
  const n = TIMEFRAME_POINTS[timeframe];
  const volatility =
    basePrice *
    (timeframe === '1D' ? 0.0045 : timeframe === '1W' ? 0.009 : timeframe === '1M' ? 0.015 : timeframe === '6M' ? 0.024 : 0.032);
  const drift = (trendUp ? 1 : -1) * basePrice * 0.0022;
  const stepSeconds = TIMEFRAME_STEP_SECONDS[timeframe];
  const now = Math.floor(Date.now() / 1000);
  let price = basePrice * (1 - (trendUp ? 1 : -1) * 0.1);
  const candles: Candle[] = [];
  for (let i = 0; i < n; i++) {
    const open = price;
    const change = drift + (rand() - 0.5) * volatility * 2;
    const close = Math.max(open * 0.3, open + change);
    const high = Math.max(open, close) + rand() * volatility * 0.6;
    const low = Math.max(0.01, Math.min(open, close) - rand() * volatility * 0.6);
    const volume = Math.round(basePrice * 900 * (0.4 + rand()));
    candles.push({ time: now - (n - 1 - i) * stepSeconds, open, high, low, close, volume });
    price = close;
  }
  // Settle the final close near the quoted price for continuity with the header.
  const last = candles[candles.length - 1];
  const nudge = basePrice - last.close;
  last.close += nudge;
  last.high = Math.max(last.high, last.close);
  last.low = Math.min(last.low, last.close);
  return candles;
}

function fmtPrice(n: number) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtVolume(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

const W = 980;
const H = 320;
const PRICE_TOP = 14;
const PRICE_H = 206;
const VOL_TOP = PRICE_TOP + PRICE_H + 14;
const VOL_H = 64;

function ChartStage({ candles, mode }: { candles: Candle[]; mode: ChartMode }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const { lo, hi, maxVol, smaPoints, areaPath, linePath } = useMemo(() => {
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    const maxVol = Math.max(...candles.map((c) => c.volume ?? 0), 1);
    const window = Math.max(4, Math.round(candles.length / 8));
    const sma: (number | null)[] = candles.map((_, i) => {
      if (i < window - 1) return null;
      let sum = 0;
      for (let k = i - window + 1; k <= i; k++) sum += candles[k].close;
      return sum / window;
    });
    const n = candles.length;
    const slot = W / n;
    const yOf = (price: number) => PRICE_TOP + ((hi - price) / (hi - lo || 1)) * PRICE_H;
    const xOf = (i: number) => i * slot + slot / 2;

    const smaPoints = sma
      .map((v, i) => (v === null ? null : `${xOf(i)},${yOf(v)}`))
      .filter(Boolean)
      .join(' ');

    const closeLine = candles.map((c, i) => `${xOf(i)},${yOf(c.close)}`).join(' L ');
    const linePath = `M ${closeLine}`;
    const areaPath = `M ${xOf(0)},${PRICE_TOP + PRICE_H} L ${closeLine} L ${xOf(n - 1)},${PRICE_TOP + PRICE_H} Z`;

    return { lo, hi, maxVol, smaPoints, areaPath, linePath };
  }, [candles]);

  const n = candles.length;
  const slot = W / n;
  const body = Math.max(1.5, slot * 0.58);
  const yOf = (price: number) => PRICE_TOP + ((hi - price) / (hi - lo || 1)) * PRICE_H;
  const alertLevel = hi - (hi - lo) * 0.08;

  const hovered = hoverIndex !== null ? candles[hoverIndex] : null;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverIndex(Math.min(n - 1, Math.round(frac * (n - 1))));
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'pointer-events-none absolute left-0 top-0 flex items-center gap-3 rounded-lg border border-[var(--sg-border-specular)] bg-[var(--sg-glass-hover)] px-3 py-1.5 text-[11px] font-medium text-ink-2 backdrop-blur-xl transition-opacity duration-150',
          hovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        {hovered && (
          <>
            <span className="num text-ink">O {fmtPrice(hovered.open)}</span>
            <span className="num text-up">H {fmtPrice(hovered.high)}</span>
            <span className="num text-down">L {fmtPrice(hovered.low)}</span>
            <span className="num font-semibold text-ink">C {fmtPrice(hovered.close)}</span>
            <span className="num text-ink-3">Vol {fmtVolume(hovered.volume ?? 0)}</span>
          </>
        )}
      </div>

      <div
        ref={stageRef}
        className="touch-none select-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[220px] w-full md:h-[260px]" role="img" aria-label="Interactive price chart">
          <defs>
            <linearGradient id="mc-area-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--sg-cyan)" />
              <stop offset="50%" stopColor="var(--sg-cobalt)" />
              <stop offset="100%" stopColor="var(--sg-signal)" />
            </linearGradient>
            <linearGradient id="mc-area-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sg-cyan)" stopOpacity={0.32} />
              <stop offset="55%" stopColor="var(--sg-cobalt)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--sg-signal)" stopOpacity={0.02} />
            </linearGradient>
            <filter id="mc-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={0} x2={W} y1={PRICE_TOP + t * PRICE_H} y2={PRICE_TOP + t * PRICE_H} stroke="var(--sg-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}

          <line
            x1={0}
            x2={W}
            y1={yOf(alertLevel)}
            y2={yOf(alertLevel)}
            stroke="var(--sg-signal)"
            strokeWidth={1.5}
            strokeDasharray="7 6"
            vectorEffect="non-scaling-stroke"
            opacity={0.7}
          />
          <text x={W - 4} y={yOf(alertLevel) - 6} textAnchor="end" className="num" fontSize={11} fill="var(--sg-signal)">
            ALERT {fmtPrice(alertLevel)}
          </text>

          {mode === 'candles' ? (
            <>
              {candles.map((c, i) => {
                const x = i * slot + slot / 2;
                const up = c.close >= c.open;
                const color = up ? 'var(--sg-up)' : 'var(--sg-down)';
                const top = yOf(Math.max(c.open, c.close));
                const bottom = yOf(Math.min(c.open, c.close));
                return (
                  <g key={c.time}>
                    <line x1={x} x2={x} y1={yOf(c.high)} y2={yOf(c.low)} stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.9} />
                    <rect x={x - body / 2} y={top} width={body} height={Math.max(1, bottom - top)} fill={color} />
                  </g>
                );
              })}
              {smaPoints && <polyline points={smaPoints} fill="none" stroke="var(--sg-violet)" strokeWidth={2} vectorEffect="non-scaling-stroke" opacity={0.9} />}
            </>
          ) : (
            <>
              <path d={areaPath} fill="url(#mc-area-fill)" />
              <path d={linePath} fill="none" stroke="url(#mc-area-stroke)" strokeWidth={2.4} vectorEffect="non-scaling-stroke" filter="url(#mc-glow)" />
            </>
          )}

          {candles.map((c, i) => (
            <rect
              key={`v-${c.time}`}
              x={i * slot + slot * 0.2}
              y={VOL_TOP + VOL_H - ((c.volume ?? 0) / maxVol) * VOL_H}
              width={slot * 0.6}
              height={Math.max(1, ((c.volume ?? 0) / maxVol) * VOL_H)}
              fill={c.close >= c.open ? 'var(--sg-up)' : 'var(--sg-down)'}
              opacity={hoverIndex === i ? 0.85 : 0.4}
            />
          ))}

          {hoverIndex !== null && (
            <line
              x1={hoverIndex * slot + slot / 2}
              x2={hoverIndex * slot + slot / 2}
              y1={PRICE_TOP}
              y2={VOL_TOP + VOL_H}
              stroke="var(--sg-ink-2)"
              strokeWidth={1}
              strokeDasharray="3 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function AiGauge({ score }: { score: number }) {
  const angle = Math.min(100, Math.max(0, score)) * 3.6;
  return (
    <div
      className="relative size-14 flex-none rounded-full"
      style={{
        background: `conic-gradient(var(--sg-violet) 0deg, var(--sg-signal) ${angle}deg, var(--sg-surface-3) ${angle}deg 360deg)`,
      }}
    >
      <div className="absolute inset-[3px] flex flex-col items-center justify-center rounded-full bg-[var(--sg-surface)]">
        <CountUp value={score} className="text-sm font-semibold text-ink" />
      </div>
    </div>
  );
}

function OrbitPill({
  icon,
  label,
  valueClassName,
  value,
  pillRef,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName: string;
  pillRef: React.Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <div
      ref={pillRef}
      className={cn(
        'absolute hidden items-center gap-2 rounded-full border border-[var(--sg-border-specular)] bg-[var(--sg-glass)] px-3.5 py-2 text-[11px] font-medium whitespace-nowrap text-ink-2 backdrop-blur-xl lg:flex',
        className
      )}
      style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.14), var(--sg-shadow)' }}
    >
      {icon}
      <span>{label}</span>
      <span className={cn('num font-semibold', valueClassName)}>{value}</span>
    </div>
  );
}

export function MarketCommand({ data }: { data: MarketingLiveData }) {
  const symbols = useMemo(() => buildSymbolList(data), [data]);
  const [activeSymbol, setActiveSymbol] = useState(symbols.includes(data.hero.symbol) ? data.hero.symbol : symbols[0]);
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');
  const [mode, setMode] = useState<ChartMode>('area');
  const uid = useId();

  const pill1 = useRef<HTMLDivElement>(null);
  const pill2 = useRef<HTMLDivElement>(null);
  const pill3 = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const configs: [React.RefObject<HTMLDivElement | null>, number, number][] = [
      [pill1, 10, 7.5],
      [pill2, -8, 8.5],
      [pill3, 9, 9.5],
    ];
    configs.forEach(([ref, y, duration]) => {
      if (!ref.current) return;
      gsap.to(ref.current, { y, duration, ease: 'sine.inOut', repeat: -1, yoyo: true });
    });
  }, []);

  const quote = useMemo(() => resolveQuote(activeSymbol, data), [activeSymbol, data]);

  const candles = useMemo(() => {
    if (activeSymbol === data.hero.symbol && timeframe === '6M' && data.heroCandles.length > 20) {
      return data.heroCandles;
    }
    return generateCandles(activeSymbol, timeframe, quote.price, quote.up);
  }, [activeSymbol, timeframe, quote.price, quote.up, data.hero.symbol, data.heroCandles]);

  return (
    <div className="relative mx-auto w-full max-w-[700px] py-6 lg:py-10">
      <OrbitPill
        pillRef={pill1}
        className="-top-2 left-2 lg:-top-5 lg:-left-10"
        icon={<Activity className="size-3.5 text-[var(--sg-violet)]" strokeWidth={2} />}
        label="AI Regime"
        value="Bullish 84/100"
        valueClassName="text-[var(--sg-signal)]"
      />
      <OrbitPill
        pillRef={pill2}
        className="top-10 -right-2 lg:top-6 lg:-right-14"
        icon={<Zap className="size-3.5 text-[var(--sg-cyan)]" strokeWidth={2} />}
        label="Feed Latency"
        value="14ms"
        valueClassName="text-[var(--sg-cyan)]"
      />
      <OrbitPill
        pillRef={pill3}
        className="-bottom-3 left-6 lg:-bottom-6 lg:-left-6"
        icon={<Gauge className="size-3.5 text-up" strokeWidth={2} />}
        label="Institutional Flow"
        value="+$142.8M"
        valueClassName="text-up"
      />

      <SpotlightCard tilt spotlightColor="cyan" className="w-full p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="num text-xl font-semibold tracking-[-0.02em] text-ink md:text-2xl">{quote.symbol}</div>
              <div className="truncate text-xs text-ink-3">{quote.name}</div>
            </div>
            <div className="h-9 w-px bg-[var(--sg-border-specular)]" />
            <div>
              <CountUp
                value={quote.price}
                decimals={quote.price >= 1000 ? 0 : 2}
                prefix="$"
                className="num text-2xl font-semibold tracking-[-0.03em] text-ink md:text-3xl"
              />
              <div
                className={cn(
                  'num mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                  quote.up ? 'bg-up/15 text-up' : 'bg-down/15 text-down'
                )}
              >
                {quote.up ? '+' : ''}
                {quote.changePct.toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AiGauge score={quote.aiScore} />
            <div className="text-[11px] leading-tight text-ink-3">
              AI
              <br />
              Score
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Symbols">
          {symbols.map((sym) => (
            <button
              key={sym}
              type="button"
              role="tab"
              aria-selected={sym === activeSymbol}
              onClick={() => setActiveSymbol(sym)}
              className={cn(
                'press num hit-slop rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                sym === activeSymbol ? 'bg-signal text-signal-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
              )}
            >
              {sym}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <ChartStage candles={candles} mode={mode} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1" role="tablist" aria-label="Timeframe">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                role="tab"
                aria-selected={tf === timeframe}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'press hit-slop rounded-md px-2 py-1 text-[11px] font-semibold',
                  tf === timeframe ? 'bg-surface-3 text-ink' : 'text-ink-3 hover:text-ink-2'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 p-0.5" role="tablist" aria-label="Chart mode">
            {(['candles', 'area'] as ChartMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  'press hit-slop rounded-md px-2.5 py-1 text-[11px] font-semibold',
                  mode === m ? 'bg-surface text-ink shadow-sm' : 'text-ink-3 hover:text-ink-2'
                )}
              >
                {m === 'candles' ? 'Candles + SMA' : 'Luminous Area'}
              </button>
            ))}
          </div>
        </div>
        <p id={`${uid}-caption`} className="sr-only">
          {quote.symbol} price chart over {timeframe}, currently {fmtPrice(quote.price)}.
        </p>
      </SpotlightCard>
    </div>
  );
}
