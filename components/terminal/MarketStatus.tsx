'use client';

import { useEffect, useState } from 'react';

type SessionState = 'PRE-MARKET' | 'OPEN' | 'AFTER-HOURS' | 'CLOSED';

const STATE_LABEL: Record<SessionState, string> = {
  OPEN: 'Markets open',
  'PRE-MARKET': 'Pre-market',
  'AFTER-HOURS': 'After hours',
  CLOSED: 'Markets closed',
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
 * Live US equity session state (America/New_York) as plain muted text —
 * no pill, no dot, no latency readout. Renders CLOSED for the SSR pass so
 * there is never a flash of an incorrect session on hydration mismatch.
 */
export function MarketStatus({ className = '' }: { className?: string }) {
  const [state, setState] = useState<SessionState>('CLOSED');

  useEffect(() => {
    setState(sessionAt(new Date()));
    const interval = window.setInterval(() => setState(sessionAt(new Date())), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <span className={`text-[15px] text-ink-3 ${className}`} suppressHydrationWarning>
      {STATE_LABEL[state]}
    </span>
  );
}

export default MarketStatus;
