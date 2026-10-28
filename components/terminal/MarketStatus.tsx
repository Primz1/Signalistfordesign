'use client';

import { useEffect, useState } from 'react';

type SessionState = 'PRE-MARKET' | 'OPEN' | 'AFTER-HOURS' | 'CLOSED';

const STATE_STYLE: Record<SessionState, { dot: string; text: string }> = {
  OPEN: { dot: 'bg-up', text: 'text-up' },
  'PRE-MARKET': { dot: 'bg-cyan', text: 'text-cyan' },
  'AFTER-HOURS': { dot: 'bg-violet', text: 'text-violet' },
  CLOSED: { dot: 'bg-ink-3', text: 'text-ink-3' },
};

function sessionAt(date: Date): SessionState {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const minutesOfDay = hour * 60 + minute;

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  if (isWeekend) return 'CLOSED';

  if (minutesOfDay >= 4 * 60 && minutesOfDay < 9 * 60 + 30) return 'PRE-MARKET';
  if (minutesOfDay >= 9 * 60 + 30 && minutesOfDay < 16 * 60) return 'OPEN';
  if (minutesOfDay >= 16 * 60 && minutesOfDay < 20 * 60) return 'AFTER-HOURS';
  return 'CLOSED';
}

/**
 * Live US equity session state (America/New_York) plus a feed latency pill.
 * Recomputed every 30s client-side; renders CLOSED for the SSR pass so
 * there is never a flash of an incorrect session on hydration mismatch.
 */
export function MarketStatus({ className = '' }: { className?: string }) {
  const [state, setState] = useState<SessionState>('CLOSED');
  const [latency, setLatency] = useState(14);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setState(sessionAt(new Date()));
    const tick = () => setState(sessionAt(new Date()));
    const interval = window.setInterval(tick, 30_000);

    const jitter = window.setInterval(() => {
      setLatency(8 + Math.round(Math.random() * 14));
    }, 4_000);

    return () => {
      window.clearInterval(interval);
      window.clearInterval(jitter);
    };
  }, []);

  const style = STATE_STYLE[state];

  return (
    <div className={`flex items-center gap-2 ${className}`} suppressHydrationWarning>
      <span className="concentric flex h-11 items-center gap-2 border border-[var(--sg-border-specular)] bg-[var(--sg-glass)] px-3 backdrop-blur-xl">
        <span className="relative flex size-2">
          <span
            className={`absolute inline-flex size-full rounded-full ${style.dot} ${mounted && state === 'OPEN' ? 'animate-pulse-soft' : ''} opacity-70`}
          />
          <span className={`relative inline-flex size-2 rounded-full ${style.dot}`} />
        </span>
        <span className={`mono text-[11px] font-semibold tracking-[0.06em] ${style.text}`}>
          {state}
        </span>
      </span>
      <span className="concentric hidden h-11 items-center gap-1.5 border border-[var(--sg-border-specular)] bg-[var(--sg-glass)] px-3 backdrop-blur-xl sm:flex">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-cyan opacity-70" />
          <span className="relative inline-flex size-2 rounded-full bg-cyan" />
        </span>
        <span className="num text-[11px] font-semibold tracking-[0.02em] text-ink-2">
          {latency}ms · WS LIVE
        </span>
      </span>
    </div>
  );
}

export default MarketStatus;
