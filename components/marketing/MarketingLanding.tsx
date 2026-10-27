'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import BrandLogo from '@/components/layout/BrandLogo';
import { MarketingSearch } from '@/components/marketing/MarketingSearch';
import { AlertLevelChart } from '@/components/marketing/AlertLevelChart';
import { cn } from '@/lib/utils';
import type { MarketingLiveData, MarketingQuote } from '@/lib/marketing/live-data';

/**
 * Landing: "the alert level" is the motif. The hero chart lets visitors drag a level over
 * real candles; every later section is about what happens at a level you chose.
 */

const NAV = [
  { href: '#alerts', label: 'Alerts' },
  { href: '#research', label: 'Research' },
  { href: '#paper', label: 'Paper trading' },
  { href: '#api', label: 'API' },
];

/** Reveal sections below the fold once. Nothing is hidden unless this script runs. */
function useRevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const below = els.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
    if (!('IntersectionObserver' in window) || below.length === 0) return;
    below.forEach((el) => el.classList.add('reveal-pending'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove('reveal-pending');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    below.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Header() {
  return (
    <header className="app-bar sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center gap-4 px-4 md:gap-8 md:px-8">
      <BrandLogo href="/" />
      <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
        {NAV.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="inline-flex h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <MarketingSearch className="hidden sm:flex" />
        <Link
          href="/sign-in"
          className="press inline-flex h-11 items-center rounded-lg px-3 text-sm text-ink-2 hover:bg-surface-2 hover:text-ink"
        >
          Sign in
        </Link>
        <Link href="/sign-up" className="yellow-btn px-4 text-sm">
          Create account
        </Link>
      </div>
      </div>
    </header>
  );
}

function Hero({ data }: { data: MarketingLiveData }) {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pt-12 pb-16 md:px-8 md:pt-16 md:pb-24">
      <h1 className="font-display animate-el max-w-[16ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[48px] md:leading-[1.05] md:tracking-[-0.04em]">
        Trade the signal, not the noise.
      </h1>
      <div
        className="animate-el mt-6 flex flex-col gap-6 md:mt-8 md:flex-row md:items-end md:justify-between"
        style={{ animationDelay: '70ms' }}
      >
        <p className="max-w-[46ch] text-base leading-normal text-ink-2 md:text-xl md:leading-normal">
          Signalist watches the price levels you set on stocks and crypto, tells you the moment one
          is crossed, and backs every AI note with the numbers behind it.
        </p>
        <div className="flex flex-none items-center gap-3">
          <Link href="/sign-up" className="yellow-btn px-6">
            Create free account <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/sign-in"
            className="press inline-flex h-11 items-center rounded-lg px-4 text-base text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="animate-el mt-12 md:mt-16" style={{ animationDelay: '80ms' }}>
        {data.heroCandles.length > 20 ? (
          <AlertLevelChart symbol={data.hero.symbol} candles={data.heroCandles} />
        ) : (
          <QuoteBoard quotes={data.markets} columns={2} />
        )}
      </div>
    </section>
  );
}

function pct(n: number) {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;
}

function QuoteBoard({ quotes, columns = 1 }: { quotes: MarketingQuote[]; columns?: 1 | 2 }) {
  return (
    <ul className={cn('grid gap-x-16', columns === 2 && 'lg:grid-cols-2')}>
      {quotes.map((q, i) => (
        <li
          key={q.symbol}
          data-reveal
          style={{ '--i': i } as React.CSSProperties}
          className="flex min-w-0 items-baseline gap-4 border-b border-line py-3"
        >
          <span className="num w-16 flex-none text-xl font-semibold text-ink md:w-20 md:text-2xl">
            {q.symbol}
          </span>
          <span className="hidden min-w-0 flex-1 truncate text-sm text-ink-3 sm:block" title={q.name}>{q.name}</span>
          <span className="num ml-auto text-xl text-ink md:text-2xl">{q.price}</span>
          <span className={cn('num w-20 flex-none text-right text-sm', q.up ? 'text-up' : 'text-down')}>
            {pct(q.changePct)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Markets({ data }: { data: MarketingLiveData }) {
  return (
    <section className="bg-surface">
      <div className="mx-auto grid w-full max-w-[1120px] gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
        <div data-reveal>
          <h2 className="font-display max-w-[14ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[48px] md:tracking-[-0.04em]">
            Live quotes, not screenshots.
          </h2>
          <p className="mt-4 max-w-[36ch] text-base leading-normal text-ink-2">
            These came from Finnhub and Binance when this page loaded. Equities and crypto sit in
            the same list, priced the same way.
          </p>
        </div>
        <QuoteBoard quotes={data.markets} />
      </div>
    </section>
  );
}

function Alerts({ data }: { data: MarketingLiveData }) {
  const price = data.hero.priceNum;
  const step = price >= 200 ? 5 : 1;
  const level = Math.ceil((price * 1.05) / step) * step;
  const away = ((level - price) / price) * 100;
  const rows: [string, string][] = [
    ['Condition', 'Price above'],
    ['Level', level.toLocaleString('en-US', { minimumFractionDigits: 2 })],
    ['Frequency', 'Once'],
    ['Now', `${data.hero.price}  (${away.toFixed(1)}% below)`],
  ];
  return (
    <section id="alerts" className="mx-auto w-full max-w-[1120px] scroll-mt-8 px-4 py-16 md:px-8 md:py-24">
      <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
        <div data-reveal>
          <h2 className="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[48px] md:tracking-[-0.04em]">
            Your levels, watched for you.
          </h2>
          <p className="mt-4 max-w-[44ch] text-base leading-normal text-ink-2">
            Set an upper or lower price on any symbol, once or on repeat. A background price poller
            checks it, so the alert fires whether or not Signalist is open, and lands in your alert
            inbox.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-ink underline-offset-4 hover:underline"
          >
            Set your first alert <ArrowRight className="size-4" />
          </Link>
        </div>

        {/* The printed thing of this world: an alert slip, filled from the live quote */}
        <div data-reveal style={{ '--i': 1 } as React.CSSProperties} className="mx-auto w-full max-w-[460px]">
          <div className="rounded-t-lg bg-signal px-6 pt-6 pb-6 text-signal-ink">
            <div className="text-sm font-semibold">Price alert</div>
            <div className="mt-2 flex items-baseline justify-between gap-4">
              <span className="num text-[32px] leading-none font-semibold tracking-[-0.03em]">
                {data.hero.symbol}
              </span>
              <span className="text-base font-semibold">NVIDIA</span>
            </div>
          </div>
          <dl className="rounded-b-lg border border-t-0 border-line bg-surface px-6">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
                <dt className="text-sm text-ink-3">{k}</dt>
                <dd className="num text-base whitespace-pre text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-center text-sm text-ink-3">
            Built from the live {data.hero.symbol} quote.
          </p>
        </div>
      </div>
    </section>
  );
}

function Research({ data }: { data: MarketingLiveData }) {
  const r = data.research;
  if (!r) return null;
  return (
    <section id="research" className="mx-auto w-full max-w-[1120px] scroll-mt-8 px-4 py-16 md:px-8 md:py-24">
      <h2
        data-reveal
        className="font-display max-w-[18ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[48px] md:tracking-[-0.04em]"
      >
        Numbers first. Words second.
      </h2>
      <p data-reveal className="mt-4 max-w-[65ch] text-base leading-normal text-ink-2">
        Signalist computes the factors in Python (trend, RSI, MACD, momentum, risk), then the
        narrative is written only from those figures, with a confidence score you can weigh.
      </p>

      <div className="mt-16 grid gap-10 md:mt-20 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
        <div data-reveal>
          <div className="num text-[48px] leading-none font-semibold tracking-[-0.04em] text-ink">
            {r.confidence}%
          </div>
          <div className="mt-2 text-base text-ink-2">confidence on {r.symbol}</div>
        </div>
        <blockquote data-reveal style={{ '--i': 1 } as React.CSSProperties} className="self-end">
          <p className="font-display max-w-[36ch] text-2xl leading-snug tracking-[-0.02em] text-ink">
            “{r.summary}”
          </p>
          <footer className="mt-5 text-[14px] text-ink-3">
            {r.isSample
              ? 'Example narrative. Your reports are generated per symbol when you ask.'
              : `Latest report generated on Signalist for ${r.symbol}.`}
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

const PAPER_FACTS = [
  { big: '$10,000', small: 'of paper cash to start' },
  { big: 'Live', small: 'fills at the current quote' },
  { big: '5 min', small: 'to undo any trade' },
  { big: 'CSV', small: 'export of realized P/L' },
];

function Paper() {
  return (
    <section id="paper" className="scroll-mt-8 border-y border-line bg-surface text-ink">
      <div className="mx-auto w-full max-w-[1120px] px-4 py-16 md:px-8 md:py-24">
        <h2
          data-reveal
          className="font-display max-w-[16ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] md:text-[48px] md:tracking-[-0.04em]"
        >
          Practise on paper first.
        </h2>
        <p data-reveal className="mt-4 max-w-[48ch] text-base leading-normal text-ink-2">
          Size a position, watch it against the market, and see your realized P/L, without a
          brokerage account anywhere in the loop.
        </p>
        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 md:mt-16 lg:grid-cols-4">
          {PAPER_FACTS.map((f, i) => (
            <div key={f.big} data-reveal style={{ '--i': i } as React.CSSProperties}>
              <dt className="num text-[32px] leading-none font-semibold tracking-[-0.03em] text-ink">
                {f.big}
              </dt>
              <dd className="mt-2 text-base text-ink-2">{f.small}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Api({ data }: { data: MarketingLiveData }) {
  const sym = data.hero.symbol;
  return (
    <section id="api" className="mx-auto w-full max-w-[1120px] scroll-mt-8 px-4 py-16 md:px-8 md:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
        <div data-reveal>
          <h2 className="font-display text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[48px] md:tracking-[-0.04em]">
            Your signals, over HTTP.
          </h2>
          <p className="mt-4 max-w-[40ch] text-base leading-normal text-ink-2">
            Create a key under API in the app and pull price, AI score, factors and indicators for
            any symbol into your own scripts.
          </p>
        </div>
        <pre
          data-reveal
          style={{ '--i': 1 } as React.CSSProperties}
          className="min-w-0 overflow-x-auto rounded-lg border border-line bg-surface p-4 font-mono text-sm leading-normal whitespace-pre-wrap text-ink-2 md:p-6"
        >
          <code>
            <span className="text-ink-3">$ </span>
            <span className="text-ink">curl</span> https://signalist.app/api/v1/stocks/{sym} \{'\n'}
            {'    '}-H <span className="text-signal">&quot;x-api-key: sk_live_…&quot;</span>
            {'\n\n'}
            {'{\n'}
            {'  '}&quot;symbol&quot;: <span className="text-ink">&quot;{sym}&quot;</span>,{'\n'}
            {'  '}&quot;price&quot;: <span className="text-ink">{data.hero.priceNum}</span>,{'\n'}
            {'  '}&quot;changePercent&quot;: <span className="text-ink">{data.hero.changePct.toFixed(2)}</span>,{'\n'}
            {'  '}&quot;sentiment&quot;: …,{'\n'}
            {'  '}&quot;score&quot;: …,{'\n'}
            {'  '}&quot;factors&quot;: {'{ … }'},{'\n'}
            {'  '}&quot;indicators&quot;: {'{ … }'}
            {'\n}'}
          </code>
        </pre>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pb-16 md:px-8 md:pb-24">
      <div data-reveal className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
        <h2 className="font-display max-w-[12ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink md:text-[48px] md:tracking-[-0.04em]">
          Set your first level.
        </h2>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <Link href="/sign-up" className="yellow-btn px-6">
            Create free account <ArrowRight className="size-4" />
          </Link>
          <p className="text-[14px] text-ink-3">Paper money only. No brokerage connection.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {
      title: 'Product',
      links: [
        { label: 'Alerts', href: '#alerts' },
        { label: 'Research', href: '#research' },
        { label: 'Paper trading', href: '#paper' },
        { label: 'API', href: '#api' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Create account', href: '/sign-up' },
        { label: 'Sign in', href: '/sign-in' },
      ],
    },
  ];
  return (
    <footer className="bg-surface">
      <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
        <div>
          <BrandLogo href="/" />
          <p className="mt-4 max-w-[40ch] text-[14px] leading-6 text-ink-3">
            Market data from Finnhub, Binance and TradingView, may be delayed. Nothing here is
            investment advice.
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
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-8 text-sm text-ink-3 md:px-8">
        © {new Date().getFullYear()} Signalist
      </div>
    </footer>
  );
}

export default function MarketingLanding({ data }: { data: MarketingLiveData }) {
  useRevealOnScroll();
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Header />
      <main>
        <Hero data={data} />
        <Markets data={data} />
        <Alerts data={data} />
        <Research data={data} />
        <Paper />
        <Api data={data} />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
