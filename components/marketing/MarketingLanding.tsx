'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowRight,
  Command,
  Flame,
  Gauge,
  Layers,
  LineChart,
  Radio,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import BrandLogo from '@/components/layout/BrandLogo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { MarketingSearch } from '@/components/marketing/MarketingSearch';
import { MarketCommand } from '@/components/marketing/MarketCommand';
import { AlertLevelChart } from '@/components/marketing/AlertLevelChart';
import { AuroraCanvas, SplitText, BlurText, SpotlightCard, CountUp, MagneticButton } from '@/components/motion';
import { cn } from '@/lib/utils';
import type { Candle } from '@/lib/market/ohlcv';
import type { MarketingLiveData, MarketingQuote } from '@/lib/marketing/live-data';

const NAV = [
  { href: '#intelligence', label: 'Intelligence' },
  { href: '#alerts', label: 'Alerts' },
  { href: '#markets', label: 'Markets' },
];

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function pct(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;
}

function scoreFor(symbol: string) {
  return 54 + (hashSeed(symbol) % 42);
}

/** Deterministic pseudo-random noise (no external PRNG) for decorative fallback series. */
function noise(i: number) {
  const seed = Math.sin(i * 12.9898) * 43758.5453;
  return seed - Math.floor(seed);
}

const FALLBACK_ALERT_CANDLES: Candle[] = (() => {
  const base = 131.88;
  const now = Math.floor(Date.now() / 1000);
  let price = base * 0.9;
  const out: Candle[] = [];
  for (let i = 0; i < 60; i++) {
    const r = noise(i);
    const change = base * 0.012 * (r - 0.45);
    const close = Math.max(base * 0.5, price + change);
    const high = Math.max(price, close) + base * 0.004 * r;
    const low = Math.min(price, close) - base * 0.004 * (1 - r);
    out.push({ time: now - (60 - i) * 86400, open: price, high, low, close, volume: 1_000_000 * r });
    price = close;
  }
  return out;
})();

function Sparkline({ points, up, className }: { points: number[]; up: boolean; className?: string }) {
  const w = 56;
  const h = 20;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = w / (points.length - 1 || 1);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step},${h - ((p - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn('h-5 w-14 flex-none', className)} aria-hidden>
      <path d={d} fill="none" stroke={up ? 'var(--sg-up)' : 'var(--sg-down)'} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ScoreMeter({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`AI score ${score} of 100`}>
      <div className="h-1.5 w-14 flex-none overflow-hidden rounded-full bg-surface-3">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            background: 'linear-gradient(90deg, var(--sg-violet), var(--sg-signal))',
          }}
        />
      </div>
      <span className="num text-xs font-semibold text-ink-2">{score}</span>
    </div>
  );
}

function PulsePill() {
  return (
    <div className="hidden items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-2 sm:flex">
      <span className="relative flex size-2">
        <span className="absolute inset-0 rounded-full bg-up animate-pulse-soft" />
      </span>
      NYSE &amp; crypto feeds live
    </div>
  );
}

function Header() {
  return (
    <header className="app-bar sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-3 px-4 md:gap-6 md:px-8">
        <BrandLogo href="/" />
        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="press inline-flex h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden xl:block">
          <PulsePill />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <MarketingSearch className="hidden sm:flex" />
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="press hidden h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/preview/dashboard"
            className="press hidden h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink md:inline-flex"
          >
            Live demo
          </Link>
          <MagneticButton radius={70} strength={0.3}>
            <Link href="/sign-up" className="yellow-btn px-4 text-sm">
              Launch Terminal
            </Link>
          </MagneticButton>
        </div>
      </div>
    </header>
  );
}

function TickerTape({ tape }: { tape: MarketingQuote[] }) {
  const doubled = [...tape, ...tape];
  return (
    <div className="relative mt-10 overflow-hidden border-t border-b border-line/70 py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="animate-marquee flex w-max items-center gap-10 will-change-transform motion-reduce:animate-none">
        {doubled.map((q, i) => (
          <div key={`${q.symbol}-${i}`} className="flex flex-none items-center gap-3">
            <span className="num text-sm font-semibold text-ink">{q.symbol}</span>
            <Sparkline points={q.points} up={q.up} />
            <span className="num text-sm text-ink-2">{q.price}</span>
            <span className={cn('num rounded-full px-1.5 py-0.5 text-xs font-semibold', q.up ? 'bg-up/15 text-up' : 'bg-down/15 text-down')}>
              {pct(q.changePct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero({ data }: { data: MarketingLiveData }) {
  return (
    <section className="relative overflow-hidden">
      <AuroraCanvas />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 pt-16 pb-6 md:px-8 md:pt-24">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--sg-border-specular)] bg-[var(--sg-glass)] px-4 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-ink-2 uppercase backdrop-blur-xl">
            <Sparkles className="size-3.5 text-[var(--sg-violet)]" strokeWidth={2} />
            Signalist Quantum 2.6 · Multi-Asset Intelligence
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <SplitText
            as="h1"
            text="Institutional market vision,"
            className="font-display max-w-[20ch] text-[clamp(2.25rem,5.6vw,4.25rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-ink"
          />
          <div className="my-6 w-full">
            <MarketCommand data={data} />
          </div>
          <BlurText
            as="p"
            text="engineered for asymmetric conviction."
            highlightWords={['asymmetric', 'conviction']}
            className="font-display max-w-[32ch] text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.1] tracking-[-0.02em] text-ink-2"
          />
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <MagneticButton>
            <Link href="/sign-up" className="yellow-btn px-6 text-base">
              Start Free Paper Terminal <ArrowRight className="size-4" />
            </Link>
          </MagneticButton>
          <Link href="/preview/dashboard" className="ghost-btn px-6 text-base">
            Explore Live Workspace
          </Link>
          <MarketingSearch className="border border-line bg-surface-2" />
        </div>

        <TickerTape tape={data.tape} />
      </div>
    </section>
  );
}

function FactorBars({ confidence }: { confidence: number }) {
  const factors = [
    { label: 'Momentum', value: Math.min(96, confidence + 8), color: 'var(--sg-signal)' },
    { label: 'Volatility', value: Math.max(18, 70 - confidence * 0.4), color: 'var(--sg-cyan)' },
    { label: 'Volume Profile', value: Math.min(92, confidence + 14), color: 'var(--sg-cobalt)' },
    { label: 'Macro Sentiment', value: Math.max(30, confidence - 6), color: 'var(--sg-violet)' },
  ];
  return (
    <div className="grid gap-3">
      {factors.map((f) => (
        <div key={f.label}>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-ink-2">{f.label}</span>
            <span className="num font-semibold text-ink">{Math.round(f.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-ui)]" style={{ width: `${f.value}%`, background: f.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RegimeCard({ data }: { data: MarketingLiveData }) {
  const r = data.research;
  const confidence = r?.confidence ?? 72;
  return (
    <SpotlightCard spotlightColor="violet" className="h-full w-full p-6" style={{ '--i': 0 } as React.CSSProperties}>
      <div className="flex items-center gap-2">
        <Layers className="size-4 text-[var(--sg-violet)]" strokeWidth={2} />
        <span className="label-sm">AI Regime &amp; Thesis Engine</span>
      </div>
      <h3 className="font-display mt-3 max-w-[28ch] text-2xl leading-tight tracking-[-0.02em] text-ink md:text-[28px]">
        Multi-factor conviction, computed before it&apos;s written.
      </h3>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <FactorBars confidence={confidence} />
        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="num text-sm font-semibold text-ink">{r?.symbol ?? data.hero.symbol}</span>
            <span className="num rounded-full bg-signal/15 px-2 py-0.5 text-xs font-semibold text-signal">{confidence}% confidence</span>
          </div>
          <p className="mt-3 text-sm leading-normal text-ink-2">&ldquo;{r?.summary ?? 'Trend above SMA50 with RSI cooling from overbought.'}&rdquo;</p>
          <p className="mt-3 text-[11px] text-ink-3">{r?.isSample ? 'Example narrative.' : 'Latest generated report.'}</p>
        </div>
      </div>
    </SpotlightCard>
  );
}

function AlertChannelCard({ data }: { data: MarketingLiveData }) {
  const candles = data.heroCandles.length > 20 ? data.heroCandles : FALLBACK_ALERT_CANDLES;
  return (
    <SpotlightCard spotlightColor="lime" className="h-full w-full p-6" style={{ '--i': 1 } as React.CSSProperties}>
      <div className="flex items-center gap-2">
        <Radio className="size-4 text-signal" strokeWidth={2} />
        <span className="label-sm">Sub-Second Alert Channel</span>
      </div>
      <h3 className="font-display mt-3 max-w-[24ch] text-2xl leading-tight tracking-[-0.02em] text-ink">
        Watch the channel, not the tick.
      </h3>
      <div className="relative mt-5">
        <div className="pointer-events-none absolute inset-x-0 top-[18%] z-10 flex items-center gap-2 px-1">
          <span className="text-[10px] font-semibold tracking-[0.04em] text-up uppercase">Upper breakout</span>
          <div className="h-px flex-1 border-t border-dashed border-up/50" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[22%] z-10 flex items-center gap-2 px-1">
          <div className="h-px flex-1 border-t border-dashed border-down/50" />
          <span className="text-[10px] font-semibold tracking-[0.04em] text-down uppercase">Lower breakout</span>
        </div>
        <AlertLevelChart symbol={data.hero.symbol} candles={candles} />
      </div>
    </SpotlightCard>
  );
}

function CommandPaletteCard() {
  const rows = [
    { label: 'Jump to NVDA', hint: 'Symbol' },
    { label: 'Create price alert', hint: 'Action' },
    { label: 'Open live workspace', hint: 'Nav' },
  ];
  return (
    <SpotlightCard spotlightColor="cyan" className="h-full w-full p-6" style={{ '--i': 2 } as React.CSSProperties}>
      <div className="flex items-center gap-2">
        <Command className="size-4 text-[var(--sg-cyan)]" strokeWidth={2} />
        <span className="label-sm">Instant Command Palette</span>
      </div>
      <h3 className="font-display mt-3 text-xl leading-tight tracking-[-0.02em] text-ink">Zero-millisecond ⌘K.</h3>
      <button
        type="button"
        onClick={() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
        }}
        className="press hit-slop mt-4 w-full rounded-xl border border-line-strong bg-surface-2 p-3 text-left"
      >
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between border-b border-line py-2 text-sm last:border-0">
            <span className="text-ink-2">{row.label}</span>
            <span className="text-[11px] text-ink-3">{row.hint}</span>
          </div>
        ))}
      </button>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-ink-3">
        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5">↑↓</kbd>
        navigate
        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5">↵</kbd>
        select
        <kbd className="rounded border border-line bg-surface-2 px-1.5 py-0.5">Esc</kbd>
        close
      </div>
    </SpotlightCard>
  );
}

function OptimisticDemoCard() {
  const [starred, setStarred] = useState<Record<string, boolean>>({ AAPL: true, NVDA: false, TSLA: false });
  const [key, setKey] = useState('—');

  function toggle(symbol: string) {
    const wasStarred = !!starred[symbol];
    const nextKey = crypto.randomUUID();
    setStarred((s) => ({ ...s, [symbol]: !wasStarred }));
    setKey(nextKey);
    toast(wasStarred ? `${symbol} removed from watchlist` : `${symbol} added to watchlist`, {
      action: {
        label: 'Undo',
        onClick: () => setStarred((s) => ({ ...s, [symbol]: wasStarred })),
      },
    });
  }

  return (
    <SpotlightCard spotlightColor="cobalt" className="h-full w-full p-6" style={{ '--i': 3 } as React.CSSProperties}>
      <div className="flex items-center gap-2">
        <Gauge className="size-4 text-[var(--sg-cobalt)]" strokeWidth={2} />
        <span className="label-sm">Optimistic 0ms Execution</span>
      </div>
      <h3 className="font-display mt-3 text-xl leading-tight tracking-[-0.02em] text-ink">Fires before the network does.</h3>
      <div className="mt-4 flex flex-col gap-1.5">
        {Object.keys(starred).map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => toggle(symbol)}
            className="press hit-slop flex h-11 items-center justify-between rounded-lg border border-line bg-surface-2 px-3 text-sm"
          >
            <span className="num font-semibold text-ink">{symbol}</span>
            <Star className={cn('size-4', starred[symbol] ? 'fill-signal text-signal' : 'text-ink-3')} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11px] text-ink-3">
        Idempotency key
        <div className="num mt-0.5 truncate text-ink-2">{key}</div>
      </div>
    </SpotlightCard>
  );
}

function HeatmapCard({ data }: { data: MarketingLiveData }) {
  return (
    <SpotlightCard spotlightColor="violet" className="h-full w-full p-6" style={{ '--i': 4 } as React.CSSProperties}>
      <div className="flex items-center gap-2">
        <Flame className="size-4 text-[var(--sg-warm)]" strokeWidth={2} />
        <span className="label-sm">Cross-Asset Regime Heatmap</span>
      </div>
      <h3 className="font-display mt-3 text-xl leading-tight tracking-[-0.02em] text-ink">Where the heat is, right now.</h3>
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {data.markets.map((q) => {
          const intensity = Math.min(1, Math.abs(q.changePct) / 3);
          return (
            <div
              key={q.symbol}
              className="flex flex-col items-center justify-center gap-0.5 rounded-lg py-3 text-center"
              style={{ background: q.up ? `rgba(16,185,129,${0.1 + intensity * 0.35})` : `rgba(255,59,105,${0.1 + intensity * 0.35})` }}
            >
              <span className="num text-xs font-semibold text-ink">{q.symbol}</span>
              <span className={cn('num text-[10px] font-semibold', q.up ? 'text-up' : 'text-down')}>{pct(q.changePct)}</span>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

function BentoGrid({ data }: { data: MarketingLiveData }) {
  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
      <div data-reveal className="mb-10 text-center">
        <h2 className="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[42px]">
          Every edge, in one glass.
        </h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-base text-ink-2">
          Five live systems feeding one terminal — regime detection, alert channels, instant navigation, optimistic
          execution, and a cross-asset heatmap.
        </p>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div id="intelligence" data-reveal className="col-span-12 scroll-mt-24 lg:col-span-7">
          <RegimeCard data={data} />
        </div>
        <div id="alerts" data-reveal className="col-span-12 scroll-mt-24 lg:col-span-5">
          <AlertChannelCard data={data} />
        </div>
        <div data-reveal className="col-span-12 md:col-span-6 lg:col-span-4">
          <CommandPaletteCard />
        </div>
        <div data-reveal className="col-span-12 md:col-span-6 lg:col-span-4">
          <OptimisticDemoCard />
        </div>
        <div data-reveal className="col-span-12 lg:col-span-4">
          <HeatmapCard data={data} />
        </div>
      </div>
    </section>
  );
}

function MatrixRow({ q, aiScore }: { q: MarketingQuote; aiScore: number }) {
  return (
    <li className="flex items-center gap-4 border-b border-line py-3 last:border-0">
      <span className="num w-16 flex-none text-sm font-semibold text-ink">{q.symbol}</span>
      <Sparkline points={q.points} up={q.up} />
      <CountUp value={q.priceNum} decimals={q.priceNum >= 1000 ? 0 : 2} prefix="$" className="num ml-auto text-sm text-ink" />
      <span className={cn('num w-16 flex-none text-right text-xs font-semibold', q.up ? 'text-up' : 'text-down')}>{pct(q.changePct)}</span>
      <ScoreMeter score={aiScore} />
    </li>
  );
}

function MarketMatrix({ data }: { data: MarketingLiveData }) {
  return (
    <section id="markets" className="scroll-mt-24 border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
        <div data-reveal className="mb-10 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display max-w-[20ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[42px]">
              Live market matrix.
            </h2>
            <p className="mt-3 max-w-[48ch] text-base text-ink-2">
              Priced from Finnhub and Binance when this page loaded — the same feed your workspace runs on.
            </p>
          </div>
          <Link href="/preview/stock" className="ghost-btn flex-none px-5 text-sm">
            Open live workspace preview <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div data-reveal className="surface-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <LineChart className="size-4 text-[var(--sg-cobalt)]" strokeWidth={2} />
              <span className="label-sm">Markets</span>
            </div>
            <ul>
              {data.markets.map((q) => (
                <MatrixRow key={q.symbol} q={q} aiScore={scoreFor(q.symbol)} />
              ))}
            </ul>
          </div>
          <div data-reveal style={{ '--i': 1 } as React.CSSProperties} className="surface-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-up" strokeWidth={2} />
              <span className="label-sm">Watchlist preview</span>
            </div>
            <ul>
              {data.watchlist.map((q) => (
                <MatrixRow key={q.symbol} q={q} aiScore={scoreFor(q.symbol)} />
              ))}
            </ul>
            <Link href="/sign-up" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline">
              Build your own watchlist <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="relative overflow-hidden">
      <AuroraCanvas className="opacity-70" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 py-20 md:px-8 md:py-28">
        <div data-reveal className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-display max-w-[20ch] text-[34px] leading-[1.08] font-semibold tracking-[-0.03em] text-ink md:text-[52px]">
            Set your first level.
          </h2>
          <p className="max-w-[48ch] text-base text-ink-2 md:text-lg">
            Paper money only. No brokerage connection. Real-time feeds, real AI regime detection.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <MagneticButton>
              <Link href="/sign-up" className="yellow-btn px-7 text-base">
                Create free account <ArrowRight className="size-4" />
              </Link>
            </MagneticButton>
            <Link href="/preview/dashboard" className="ghost-btn px-7 text-base">
              Explore live workspace
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-3">
            <TrendingDown className="size-3.5" strokeWidth={1.5} />
            Nothing here is investment advice.
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {
      title: 'Platform',
      links: [
        { label: 'Intelligence', href: '#intelligence' },
        { label: 'Alerts', href: '#alerts' },
        { label: 'Markets', href: '#markets' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Create account', href: '/sign-up' },
        { label: 'Sign in', href: '/sign-in' },
        { label: 'Live demo', href: '/preview/dashboard' },
      ],
    },
  ];
  return (
    <footer className="bg-surface">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
        <div>
          <BrandLogo href="/" />
          <p className="mt-4 max-w-[40ch] text-[14px] leading-6 text-ink-3">
            Market data from Finnhub, Binance and TradingView, may be delayed. Nothing here is investment advice.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-[14px] font-medium text-ink">{c.title}</div>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[14px] text-ink-2 hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-8 text-sm text-ink-3 md:px-8">© {new Date().getFullYear()} Signalist</div>
    </footer>
  );
}

export default function MarketingLanding({ data }: { data: MarketingLiveData }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <main>
        <Hero data={data} />
        <BentoGrid data={data} />
        <MarketMatrix data={data} />
      </main>
      <Closing />
      <Footer />
    </div>
  );
}
