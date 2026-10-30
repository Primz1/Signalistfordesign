'use client';

import { useId, useMemo, useState } from 'react';
import { monotonePath } from '@/lib/charts/monotone-path';
import { formatPrice } from '@/lib/utils';

export type ChartRangeKey = '1D' | '1W' | '1M' | '1Y';

export type ChartPoint = { time: number; close: number };

const RANGES: ChartRangeKey[] = ['1D', '1W', '1M', '1Y'];
const RANGE_DAYS: Record<ChartRangeKey, number> = { '1D': 1, '1W': 7, '1M': 30, '1Y': 365 };

const CHART_W = 1000;
const CHART_H = 320;
/** Top headroom reserved above the highest point so the peak never clips. */
const PAD_TOP = 24;

/** Approximate calendar label for a point, walking back from "now" by range span. */
function labelForIndex(range: ChartRangeKey, index: number, total: number) {
  const now = new Date();
  const stepsFromEnd = total - 1 - index;
  if (range === '1D') {
    const stepMinutes = (6.5 * 60) / (total - 1 || 1);
    const d = new Date(now);
    d.setHours(16, 0, 0, 0);
    d.setMinutes(d.getMinutes() - stepsFromEnd * stepMinutes);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  const stepDays = RANGE_DAYS[range] / (total - 1 || 1);
  const d = new Date(now);
  d.setDate(d.getDate() - Math.round(stepsFromEnd * stepDays));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: range === '1Y' ? 'numeric' : undefined,
  });
}

/**
 * Our own themed SVG line/area chart — replaces the TradingView mini
 * widget on the dashboard. A monotone curve (never overshoots a high/low),
 * a soft gradient fill, and stroke/fill that follow price direction for the
 * active range.
 */
export function PortfolioHeroChart({
  seriesByRange,
  className,
}: {
  seriesByRange: Record<ChartRangeKey, ChartPoint[]>;
  className?: string;
}) {
  const gradientId = useId();
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
    const stepX = CHART_W / (closes.length - 1 || 1);
    const plotH = CHART_H - PAD_TOP;
    const line = monotonePath(
      closes.map((v, i) => ({ x: i * stepX, y: PAD_TOP + plotH - ((v - min) / spread) * plotH }))
    );
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
    return <div className="flex h-[200px] items-center justify-center text-sm text-ink-3 md:h-[320px]">No chart data</div>;
  }

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <div className="num text-sm text-ink-3">
          {hoverPoint && hoverIdx != null ? (
            <>
              <span className="text-ink-2">{labelForIndex(range, hoverIdx, points.length)}</span>
              <span className="mx-1.5">·</span>
              {formatPrice(displayPrice)}
            </>
          ) : (
            <>
              <span className="font-semibold" style={{ color }}>
                {up ? '+' : ''}
                {changePct.toFixed(2)}%
              </span>{' '}
              <span className="text-[13px] text-ink-3">this range</span>
            </>
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
        className="relative mt-2 h-[200px] touch-none select-none md:h-[320px]"
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
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={pathArea} fill={`url(#${gradientId})`} stroke="none" />
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
