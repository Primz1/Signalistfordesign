'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Candle } from '@/lib/market/ohlcv';
import { monotonePath } from '@/lib/charts/monotone-path';
import { cn } from '@/lib/utils';

const W = 1200;
const H = 380;
const PAD_Y = 24;

function niceStep(price: number) {
  if (price >= 1000) return 50;
  if (price >= 200) return 5;
  if (price >= 50) return 1;
  if (price >= 10) return 0.5;
  return 0.05;
}

function fmt(n: number, step: number) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: step < 1 ? 2 : 0,
    maximumFractionDigits: step < 1 ? 2 : 0,
  });
}

/** Every session where the level first entered the candle's [low, high] range, in order. */
function crossingTouches(candles: Candle[], level: number) {
  const touches: { time: number; index: number }[] = [];
  let prev = false;
  candles.forEach((c, i) => {
    const touched = c.low <= level && level <= c.high;
    if (touched && !prev) touches.push({ time: c.time, index: i });
    prev = touched;
  });
  return touches;
}

/** Down-samples touches to at most 3 representative markers: first, middle, last. */
function pickMarkers(touches: { time: number; index: number }[]) {
  if (touches.length <= 3) return touches;
  const mid = touches[Math.floor(touches.length / 2)];
  return [touches[0], mid, touches[touches.length - 1]];
}

/**
 * The landing hero's live thing: a calm single price line (not a wall of
 * candles) with the user's alert level as a thin dashed reference. Drag the
 * level (or use arrow keys) to see how often price would have reached it.
 */
export function AlertLevelChart({
  symbol,
  candles,
  className,
}: {
  symbol: string;
  candles: Candle[];
  className?: string;
}) {
  const id = useId();
  const plotRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const markersRef = useRef<SVGGElement>(null);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);

  const { lo, hi, step, initial, lastClose, closes, smoothedCloses } = useMemo(() => {
    const lows = candles.map((c) => c.low);
    const highs = candles.map((c) => c.high);
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    const closes = candles.map((c) => c.close);
    // 3-session moving average for the plotted line only — keeps the shape
    // calm and legible while touches/markers still use the raw candles.
    const smoothedCloses = closes.map((_, i) => {
      const from = Math.max(0, i - 1);
      const to = Math.min(closes.length - 1, i + 1);
      let sum = 0;
      for (let j = from; j <= to; j++) sum += closes[j];
      return sum / (to - from + 1);
    });
    const recent = closes.slice(-60).slice().sort((a, b) => a - b);
    const median = recent[Math.floor(recent.length / 2)] ?? (lo + hi) / 2;
    const step = niceStep(median);
    return {
      lo,
      hi,
      step,
      initial: Math.round(median / step) * step,
      lastClose: closes[closes.length - 1] ?? median,
      closes,
      smoothedCloses,
    };
  }, [candles]);

  const [level, setLevel] = useState(initial);
  const clamp = useCallback(
    (v: number) => Math.min(hi, Math.max(lo, Math.round(v / step) * step)),
    [hi, lo, step]
  );

  const y = useCallback(
    (price: number) => PAD_Y + ((hi - price) / (hi - lo || 1)) * (H - PAD_Y * 2),
    [hi, lo]
  );
  const levelPct = (y(level) / H) * 100;

  const n = candles.length;
  const stepX = W / (n - 1 || 1);

  const linePath = useMemo(
    () => monotonePath(smoothedCloses.map((c, i) => ({ x: i * stepX, y: y(c) }))),
    [smoothedCloses, stepX, y]
  );
  const areaPath = `${linePath} L${(n - 1) * stepX},${H} L0,${H} Z`;

  const { count, markers } = useMemo(() => {
    const touches = crossingTouches(candles, level);
    return { count: touches.length, markers: pickMarkers(touches) };
  }, [candles, level]);

  const distance = ((lastClose - level) / level) * 100;

  const setFromPointer = (clientY: number) => {
    const el = plotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const frac = (clientY - r.top) / r.height;
    const svgY = frac * H;
    const price = hi - ((svgY - PAD_Y) / (H - PAD_Y * 2)) * (hi - lo);
    setLevel(clamp(price));
  };

  const onKey = (e: React.KeyboardEvent) => {
    const big = step * 10;
    const map: Record<string, number> = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: big,
      PageDown: -big,
    };
    if (e.key in map) {
      e.preventDefault();
      setLevel((l) => clamp(l + map[e.key]));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setLevel(clamp(lo));
    } else if (e.key === 'End') {
      e.preventDefault();
      setLevel(clamp(hi));
    }
  };

  // Draw the line in once on mount; markers fade in right after. Reduced
  // motion shows the final state immediately.
  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReady(true);
      return;
    }
    const length = line.getTotalLength();
    gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(markersRef.current ? Array.from(markersRef.current.children) : [], { opacity: 0 });
    const tl = gsap.timeline({ onComplete: () => setReady(true) });
    tl.to(line, { strokeDashoffset: 0, duration: 1.3, ease: 'power3.out' }).to(
      markersRef.current ? Array.from(markersRef.current.children) : [],
      { opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.12 },
      '-=0.2'
    );
    return () => {
      tl.kill();
    };
    // Intentionally run once on mount only — the line should not redraw
    // itself every time the level (and therefore marker positions) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessions = n;
  const levelLabel = fmt(level, step);

  return (
    <figure className={cn('@container w-full', className)}>
      <figcaption className="flex flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between">
        <div>
          <div className="text-sm text-ink-2">
            <span className="num font-semibold text-ink">{symbol}</span> · daily closes, last{' '}
            {sessions} sessions
          </div>
          <div className="mt-1 text-sm text-ink-3">Drag the level, or use arrow keys to move it.</div>
        </div>
        <div className="num text-sm text-ink-3 @3xl:text-right">
          now {Math.abs(distance).toFixed(1)}% {distance >= 0 ? 'above' : 'below'} your level
        </div>
      </figcaption>

      <div
        ref={plotRef}
        className={cn(
          'relative mt-6 h-[240px] touch-none select-none md:h-[420px]',
          dragging ? 'cursor-grabbing' : 'cursor-ns-resize'
        )}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          setDragging(true);
          setFromPointer(e.clientY);
        }}
        onPointerMove={(e) => dragging && setFromPointer(e.clientY)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-y-0 left-0 h-full w-[calc(100%-5.5rem)]"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
          }}
          role="img"
          aria-label={`${symbol} daily close price, ${sessions} sessions, ranging from ${fmt(lo, step)} to ${fmt(hi, step)}`}
        >
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--sg-ink)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--sg-ink)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#${id}-fill)`} stroke="none" />
          <path
            ref={lineRef}
            d={linePath}
            fill="none"
            stroke="var(--sg-ink)"
            strokeOpacity={0.7}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />

          <line
            x1={0}
            x2={(n - 1) * stepX}
            y1={y(level)}
            y2={y(level)}
            stroke="var(--sg-signal)"
            strokeWidth={1}
            strokeDasharray="5 5"
            vectorEffect="non-scaling-stroke"
          />

          <g ref={markersRef} style={ready ? undefined : { opacity: 0 }}>
            {markers.map((m) => (
              <circle
                key={m.time}
                cx={m.index * stepX}
                cy={y(level)}
                r={4}
                fill="var(--sg-signal)"
                opacity={0.65}
              />
            ))}
          </g>
        </svg>

        <div
          aria-hidden
          className="pointer-events-none absolute right-0 h-px w-[5.5rem] bg-signal/50"
          style={{ top: `${levelPct}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-labelledby={`${id}-label`}
          aria-valuemin={lo}
          aria-valuemax={hi}
          aria-valuenow={level}
          aria-valuetext={`${levelLabel}, ${count} crossings`}
          onKeyDown={onKey}
          className={cn(
            'num absolute right-0 flex h-11 -translate-y-1/2 items-center gap-1 px-1.5 text-sm font-medium text-ink-2 outline-offset-4 focus-visible:rounded-md focus-visible:ring-1 focus-visible:ring-signal/40',
            dragging ? 'scale-[1.04]' : 'transition-[top] duration-200 ease-[var(--ease-out-ui)]'
          )}
          style={{ top: `${levelPct}%` }}
        >
          <span id={`${id}-label`} className="sr-only">
            Alert level for {symbol}
          </span>
          {levelLabel}
        </div>
      </div>

      <p className="num mt-6 text-center text-sm text-ink-3" aria-live="polite">
        {count} {count === 1 ? 'time' : 'times'} price reached it · real daily sessions, priced from
        Finnhub when this page loaded.
      </p>
    </figure>
  );
}
