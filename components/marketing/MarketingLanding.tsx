'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/layout/BrandLogo';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { AlertLevelChart } from '@/components/marketing/AlertLevelChart';
import { HeroReveal } from '@/components/marketing/HeroReveal';
import { Reveal, ScrollCountUp } from '@/components/motion';
import { useScrolled } from '@/lib/hooks/useScrolled';
import { cn } from '@/lib/utils';
import type { Candle } from '@/lib/market/ohlcv';
import type { MarketingLiveData, MarketingQuote } from '@/lib/marketing/live-data';

const NAV = [
  { href: '#alerts', label: 'Alerts' },
  { href: '#research', label: 'Research' },
  { href: '#watchlist', label: 'Watchlist' },
];

/** Deterministic pseudo-random noise (no external PRNG) for decorative fallback series. */
function noise(i: number) {
  const seed = Math.sin(i * 12.9898) * 43758.5453;
  return seed - Math.floor(seed);
}

const FALLBACK_ALERT_CANDLES: Candle[] = (() => {
  const base = 131.88;
  const now = Math.floor(Date.now() / 1000);
  let price = base * 0.9;
  let drift = 0;
  const out: Candle[] = [];
  for (let i = 0; i < 60; i++) {
    const r = noise(i);
    // Correlated drift (not independent per-day noise) so the fallback
    // series reads like a real price trail instead of a jittery sine wave.
    drift = drift * 0.82 + (r - 0.5) * base * 0.01;
    const close = Math.max(base * 0.5, price + drift);
    const high = Math.max(price, close) + base * 0.002 * r;
    const low = Math.min(price, close) - base * 0.002 * (1 - r);
    out.push({ time: now - (60 - i) * 86400, open: price, high, low, close, volume: 1_000_000 * r });
    price = close;
  }
  return out;
})();

function pct(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;
}

function fmtPrice(n: number) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

function Header() {
  const scrolled = useScrolled();
  return (
    <header className="app-bar sticky top-0 z-30 border-b border-ink/6" data-scrolled={scrolled}>
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 md:px-8">
        <BrandLogo href="/" />
        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="press inline-flex h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="press hidden h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:text-ink sm:inline-flex"
          >
            Sign in
          </Link>
          <Link href="/sign-up" className="yellow-btn px-4 text-sm">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ data }: { data: MarketingLiveData }) {
  const candles = data.heroCandles.length > 20 ? data.heroCandles : FALLBACK_ALERT_CANDLES;
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pt-20 pb-6 md:px-8 md:pt-28">
      <HeroReveal
        wrapperClassName="flex flex-col items-center text-center"
        headingClassName="font-display text-[clamp(3.5rem,8vw,7.5rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-ink"
        lines={['Your levels.', 'Watched for you.']}
      >
        <p data-hero-rest className="mt-6 max-w-[34ch] text-[19px] leading-relaxed text-ink-2">
          Set a price, write a thesis, and let the market come to you. Real feeds, real alerts, no
          noise.
        </p>
        <div data-hero-rest className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
          <Link href="/sign-up" className="yellow-btn px-6 text-base">
            Start free <ArrowRight className="size-4" />
          </Link>
          <Link href="/preview/dashboard" className="text-btn px-2 text-base">
            See a live workspace
          </Link>
        </div>
      </HeroReveal>

      <Reveal className="mt-12" items={false}>
        <AlertLevelChart symbol={data.hero.symbol} candles={candles} />
      </Reveal>
    </section>
  );
}

function FeatureRow({
  id,
  title,
  paragraph,
  fragment,
  reverse,
  align = 'center',
}: {
  id: string;
  title: string;
  paragraph: string;
  fragment: React.ReactNode;
  reverse?: boolean;
  align?: 'center' | 'start';
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-20 md:px-8 md:py-32">
      <Reveal
        className={cn(
          'grid gap-12 md:grid-cols-2 md:gap-20',
          align === 'start' ? 'items-start' : 'items-center'
        )}
      >
        <div className={reverse ? 'md:order-2' : undefined}>
          <h2 className="font-display max-w-[20ch] text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.1] font-semibold tracking-[-0.025em] text-ink">
            {title}
          </h2>
          <p className="mt-5 max-w-[46ch] text-[18px] leading-relaxed text-ink-2">{paragraph}</p>
        </div>
        <div className={reverse ? 'md:order-1' : undefined}>{fragment}</div>
      </Reveal>
    </section>
  );
}

function AlertsFragment({ data }: { data: MarketingLiveData }) {
  const rows = data.watchlist.slice(0, 3).map((q, i) => {
    const spread = [1.065, 1.084, 1.047][i % 3];
    const level = Math.round(q.priceNum * (q.up ? spread : 2 - spread) * 100) / 100;
    const distance = ((level - q.priceNum) / q.priceNum) * 100;
    return { symbol: q.symbol, level, distance };
  });
  return (
    <div className="flex flex-col divide-y divide-ink/[0.06]">
      {rows.map((r) => (
        <div key={r.symbol} className="flex h-16 items-center justify-between gap-6">
          <div>
            <div className="num text-base font-semibold text-ink">{r.symbol}</div>
            <div className="num mt-0.5 text-[15px] text-ink-3">alert at ${fmtPrice(r.level)}</div>
          </div>
          <div className={cn('num text-[15px] font-medium', r.distance >= 0 ? 'text-up' : 'text-down')}>
            {Math.abs(r.distance).toFixed(1)}% {r.distance >= 0 ? 'above' : 'below'}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResearchFragment({ data }: { data: MarketingLiveData }) {
  const r = data.research;
  return (
    <div>
      <ScrollCountUp
        value={r?.confidence ?? 72}
        className="num block text-[clamp(6rem,14vw,10rem)] leading-none font-medium tracking-[-0.03em] text-ink"
      />
      <div className="mt-3 text-base text-ink-3">AI confidence · {r?.symbol ?? data.hero.symbol}</div>
      <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-2">
        &ldquo;{r?.summary ?? 'Trend above SMA50 with RSI cooling from overbought.'}&rdquo;
      </p>
    </div>
  );
}

function WatchlistFragment({ data }: { data: MarketingLiveData }) {
  return (
    <div className="flex flex-col divide-y divide-ink/[0.06]">
      {data.watchlist.slice(0, 5).map((q: MarketingQuote) => (
        <div key={q.symbol} className="flex h-16 items-center gap-6">
          <span className="num w-20 flex-none text-base font-semibold text-ink">{q.symbol}</span>
          <Sparkline points={q.points} up={q.up} className="h-8 w-[90px]" />
          <span className="num ml-auto text-[15px] text-ink">{q.price}</span>
          <span
            className={cn('num w-20 flex-none text-right text-[15px] font-semibold', q.up ? 'text-up' : 'text-down')}
          >
            {pct(q.changePct)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Closing() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-32 text-center md:px-8 md:py-40">
      <h2 className="font-display mx-auto max-w-[20ch] text-[56px] leading-[1.05] font-semibold tracking-[-0.03em] text-ink">
        Set your first level.
      </h2>
      <p className="mx-auto mt-4 max-w-[48ch] text-lg text-ink-2">
        Paper money only. No brokerage connection required.
      </p>
      <div className="mt-8 flex justify-center">
        <Link href="/sign-up" className="yellow-btn px-7 text-base">
          Create free account <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {
      title: 'Platform',
      links: [
        { label: 'Alerts', href: '#alerts' },
        { label: 'Research', href: '#research' },
        { label: 'Watchlist', href: '#watchlist' },
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
    <footer className="border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
        <div>
          <BrandLogo href="/" />
          <p className="mt-4 max-w-[40ch] text-[13px] leading-6 text-ink-3">
            Market data from Finnhub and Binance, may be delayed. Nothing here is investment advice.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <div className="text-[13px] font-medium text-ink">{c.title}</div>
            <ul className="mt-3 space-y-2">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-ink-3 hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 text-[13px] text-ink-3 md:px-8">
        © {new Date().getFullYear()} Signalist
      </div>
    </footer>
  );
}

export default function MarketingLanding({ data }: { data: MarketingLiveData }) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <main>
        <Hero data={data} />
        <FeatureRow
          id="alerts"
          title="Set a level, we watch it."
          paragraph="Draw a line at the price you care about. We watch every tick against it and fire the moment it crosses, so you don't have to."
          fragment={<AlertsFragment data={data} />}
        />
        <FeatureRow
          id="research"
          title="Research, not noise."
          paragraph="Every symbol gets a short, generated thesis with a confidence score behind it, built from trend, momentum and volume, not a headline scroll."
          fragment={<ResearchFragment data={data} />}
          align="start"
        />
        <FeatureRow
          id="watchlist"
          title="One list, every name that matters."
          paragraph="Prices, daily moves and AI scores for your whole list in one place, updated live from the same feed your workspace runs on."
          fragment={<WatchlistFragment data={data} />}
        />
      </main>
      <Closing />
      <Footer />
    </div>
  );
}
