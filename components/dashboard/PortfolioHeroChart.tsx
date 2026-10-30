'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '@/lib/utils';

export type ChartRangeKey = '1D' | '1W' | '1M' | '1Y';

export type ChartPoint = { time: number; close: number };

const RANGES: ChartRangeKey[] = ['1D', '1W', '1M', '1Y'];

const CHART_W = 1000;
const CHART_H = 320;

function buildPath(values: number[], min: number, range: number) {
  const stepX = CHART_W / (values.length - 1 || 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = CHART_H - ((v - min) / range) * CHART_H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

/**
 * Our own themed SVG line/area chart — replaces the TradingView mini
 * widget on the dashboard. Fill is capped at 6% opacity; stroke and fill
 * follow price direction (up/down) for the active range.
 */
export function PortfolioHeroChart({
  seriesByRange,
  className,
}: {
  seriesByRange: Record<ChartRangeKey, ChartPoint[]>;
  className?: string;
}) {
  const [range, setRange] = useState<ChartRangeKey>('1M');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const points = seriesByRange[range] ?? [];

  const { pathLine, pathArea, changePct, lastClose } = useMemo(() => {
    const closes = points.map((p) => p.close);
    if (closes.length < 2) {
      return { pathLine: '', pathArea: '', changePct: 0, lastClose: closes[0] ?? 0 };
    }
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const spread = max - min || 1;
    const line = buildPath(closes, min, spread);
    const area = `${line} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
    const changePct = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
    return { pathLine: line, pathArea: area, changePct, lastClose: closes[closes.length - 1] };
  }, [points]);

  const up = changePct >= 0;
  const color = up ? 'var(--sg-up)' : 'var(--sg-down)';
  const stepX = CHART_W / (points.length - 1 || 1);
  const hoverPoint = hoverIdx != null ? points[hoverIdx] : null;
  const displayPrice = hoverPoint ? hoverPoint.close : lastClose;

  if (!points.length) {
    return <div className="flex h-[320px] items-center justify-center text-sm text-ink-3">No chart data</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="num text-sm text-ink-3">
          {hoverPoint ? (
            <>
              {formatPrice(displayPrice)} <span style={{ color }}>({up ? '+' : ''}{changePct.toFixed(2)}%)</span>
            </>
          ) : (
            <span style={{ color }}>{up ? '+' : ''}{changePct.toFixed(2)}% this range</span>
          )}
        </div>
        <div className="flex gap-5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`press relative pb-1 text-sm font-medium after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full ${
                range === r ? 'text-ink after:bg-signal' : 'text-ink-3 after:bg-transparent hover:text-ink-2'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative mt-2 touch-none select-none"
        style={{ height: CHART_H }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          setHoverIdx(Math.round(frac * (points.length - 1)));
        }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="hero-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.06} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={pathArea} fill="url(#hero-chart-fill)" stroke="none" />
          <path d={pathLine} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
          {hoverIdx != null && (
            <line
              x1={hoverIdx * stepX}
              x2={hoverIdx * stepX}
              y1={0}
              y2={CHART_H}
              stroke="var(--sg-ink-3)"
              strokeOpacity={0.35}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
