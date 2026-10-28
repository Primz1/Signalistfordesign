'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  LineStyle,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import type { Candle } from '@/lib/market/ohlcv';
import { cn } from '@/lib/utils';
import { readPalette } from '@/lib/theme';

export type IndicatorToggleKey = 'SMA20' | 'SMA50' | 'RSI' | 'MACD' | 'BB';

type ChartSeries = {
  sma20: number[];
  sma50: number[];
  rsi14?: number[];
  macd?: {
    macdLine: number[];
    signalLine: number[];
    histogram: number[];
  };
  bollinger?: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
};

type ChartData = {
  candles: Candle[];
  indicators?: {
    sma20: number;
    sma50: number;
    series?: ChartSeries;
  } | null;
};

function toLine(
  candles: Candle[],
  values: number[] | undefined
): { time: Time; value: number }[] {
  if (!values) return [];
  return candles
    .map((c, i) => ({
      time: c.time as unknown as Time,
      value: values[i],
    }))
    .filter((p) => Number.isFinite(p.value));
}

export default function CandlestickChart({
  data,
  overlays = { SMA20: true, SMA50: false, RSI: false, MACD: false, BB: false },
  height = 360,
  className,
}: {
  data: ChartData;
  overlays?: Partial<Record<IndicatorToggleKey, boolean>>;
  height?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [themeTick, setThemeTick] = useState(0);

  const lastCandle = data.candles[data.candles.length - 1];
  const [hud, setHud] = useState<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  } | null>(
    lastCandle
      ? { time: lastCandle.time, open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close, volume: lastCandle.volume }
      : null
  );

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((n) => n + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const last = data.candles[data.candles.length - 1];
    setHud(
      last
        ? { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close, volume: last.volume }
        : null
    );
  }, [data.candles]);

  const showSma20 = !!overlays.SMA20;
  const showSma50 = !!overlays.SMA50;
  const showBb = !!overlays.BB;
  const showRsi = !!overlays.RSI;
  const showMacd = !!overlays.MACD;

  useEffect(() => {
    if (!containerRef.current || !data.candles.length) return;

    const paneCount = 1 + (showRsi ? 1 : 0) + (showMacd ? 1 : 0);
    const PALETTE = readPalette();
    const mix = (color: string, amount: number) => {
      const m = color.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (m) {
        return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${amount.toFixed(2)})`;
      }
      return color;
    };
    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: PALETTE.surface },
        textColor: PALETTE.ink3,
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 12,
        attributionLogo: false,
        panes: {
          separatorColor: PALETTE.line,
          separatorHoverColor: PALETTE.lineStrong,
        },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: PALETTE.line, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: PALETTE.ink3,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: PALETTE.ink,
        },
        horzLine: {
          color: PALETTE.ink3,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: PALETTE.ink,
        },
      },
      rightPriceScale: {
        borderColor: PALETTE.line,
        borderVisible: false,
        entireTextOnly: true,
      },
      timeScale: { borderColor: PALETTE.line, borderVisible: false },
      localization: {
        priceFormatter: (price: number) =>
          price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: PALETTE.up,
      downColor: PALETTE.down,
      borderVisible: false,
      wickUpColor: PALETTE.up,
      wickDownColor: PALETTE.down,
      priceLineColor: PALETTE.signal,
      priceLineWidth: 1,
    });

    candleSeries.setData(
      data.candles.map((c) => ({
        time: c.time as unknown as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    const volumeByTime = new Map(data.candles.map((c) => [c.time, c.volume]));

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        const last = data.candles[data.candles.length - 1];
        setHud(
          last
            ? { time: last.time, open: last.open, high: last.high, low: last.low, close: last.close, volume: last.volume }
            : null
        );
        return;
      }
      const point = param.seriesData.get(candleSeries as unknown as ISeriesApi<'Candlestick'>) as CandlestickData | undefined;
      if (!point) return;
      const time = param.time as unknown as number;
      setHud({
        time,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: volumeByTime.get(time),
      });
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: PALETTE.ink3,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });

    volumeSeries.setData(
      data.candles.map((c) => ({
        time: c.time as unknown as Time,
        value: c.volume ?? 0,
        color: c.close >= c.open ? mix(PALETTE.up, 0.35) : mix(PALETTE.down, 0.35),
      }))
    );

    const series = data.indicators?.series;

    if (showSma20 && series?.sma20) {
      const s = chart.addSeries(LineSeries, {
        color: PALETTE.cyan,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(toLine(data.candles, series.sma20));
    }

    if (showSma50 && series?.sma50) {
      const s = chart.addSeries(LineSeries, {
        color: PALETTE.violet,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(toLine(data.candles, series.sma50));
    }

    if (showBb && series?.bollinger) {
      const upper = chart.addSeries(LineSeries, {
        color: mix(PALETTE.cobalt, 0.65),
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const lower = chart.addSeries(LineSeries, {
        color: mix(PALETTE.cobalt, 0.65),
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const mid = chart.addSeries(LineSeries, {
        color: mix(PALETTE.cobalt, 0.4),
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      upper.setData(toLine(data.candles, series.bollinger.upper));
      lower.setData(toLine(data.candles, series.bollinger.lower));
      mid.setData(toLine(data.candles, series.bollinger.middle));
    }

    let nextPane = 1;

    if (showRsi && series?.rsi14) {
      const rsiSeries = chart.addSeries(
        LineSeries,
        {
          color: PALETTE.warm,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          title: 'RSI',
        },
        nextPane
      );
      rsiSeries.setData(toLine(data.candles, series.rsi14));
      try {
        chart.panes()[nextPane]?.setHeight(Math.round(height * 0.22));
      } catch {
        /* pane API may vary by version */
      }
      nextPane += 1;
    }

    if (showMacd && series?.macd) {
      const hist = chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
          priceLineVisible: false,
          lastValueVisible: false,
          title: 'MACD',
        },
        nextPane
      );
      hist.setData(
        data.candles
          .map((c, i) => {
            const v = series.macd!.histogram[i];
            return {
              time: c.time as unknown as Time,
              value: v,
              color: v >= 0 ? mix(PALETTE.up, 0.55) : mix(PALETTE.down, 0.55),
            };
          })
          .filter((p) => Number.isFinite(p.value))
      );

      const macdLine = chart.addSeries(
        LineSeries,
        {
          color: PALETTE.signal,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        },
        nextPane
      );
      macdLine.setData(toLine(data.candles, series.macd.macdLine));

      const signalLine = chart.addSeries(
        LineSeries,
        {
          color: PALETTE.ink2,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        },
        nextPane
      );
      signalLine.setData(toLine(data.candles, series.macd.signalLine));

      try {
        chart.panes()[nextPane]?.setHeight(Math.round(height * 0.22));
      } catch {
        /* ignore */
      }
    }

    // Stretch main pane when extras are on
    if (paneCount > 1) {
      try {
        chart.panes()[0]?.setHeight(Math.round(height * (paneCount === 2 ? 0.7 : 0.55)));
      } catch {
        /* ignore */
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      if (containerRef.current) containerRef.current.replaceChildren();
    };
  }, [
    data.candles,
    data.indicators,
    height,
    showSma20,
    showSma50,
    showBb,
    showRsi,
    showMacd,
    themeTick,
  ]);

  if (!data.candles.length) {
    return (
      <div
        className={cn(
          'flex h-[280px] w-full items-center justify-center text-sm text-ink-3 md:h-[360px]',
          className
        )}
      >
        No chart data for this range
      </div>
    );
  }

  const hudUp = hud != null && hud.close >= hud.open;

  return (
    <div className="relative">
      {hud ? (
        <div className="num pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg border border-[var(--sg-border-specular)] bg-[var(--sg-glass)] px-2.5 py-1.5 text-[11px] backdrop-blur-xl">
          <span className="text-ink-3">O <span className="text-ink">{hud.open.toFixed(2)}</span></span>
          <span className="text-ink-3">H <span className="text-ink">{hud.high.toFixed(2)}</span></span>
          <span className="text-ink-3">L <span className="text-ink">{hud.low.toFixed(2)}</span></span>
          <span className="text-ink-3">
            C <span className={hudUp ? 'text-up' : 'text-down'}>{hud.close.toFixed(2)}</span>
          </span>
          {hud.volume != null ? (
            <span className="text-ink-3">Vol <span className="text-ink-2">{formatHudVolume(hud.volume)}</span></span>
          ) : null}
        </div>
      ) : null}
      <div ref={containerRef} className={cn('w-full', className)} />
    </div>
  );
}

function formatHudVolume(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}
