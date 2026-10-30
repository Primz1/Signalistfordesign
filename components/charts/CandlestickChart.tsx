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
  type IChartApi,
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

type PriceTag = { top: number; color: string; text: string };

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
  const [priceTag, setPriceTag] = useState<PriceTag | null>(null);

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((n) => n + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const showSma20 = !!overlays.SMA20;
  const showSma50 = !!overlays.SMA50;
  const showBb = !!overlays.BB;
  const showRsi = !!overlays.RSI;
  const showMacd = !!overlays.MACD;

  useEffect(() => {
    if (!containerRef.current || !data.candles.length) return;

    const paneCount = 1 + (showRsi ? 1 : 0) + (showMacd ? 1 : 0);
    const PALETTE = readPalette();
    const isDark = document.documentElement.classList.contains('dark');
    const mix = (color: string, amount: number) => {
      const m = color.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (m) {
        return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${amount.toFixed(2)})`;
      }
      return color;
    };
    const uiFontFamily =
      getComputedStyle(document.body).fontFamily ||
      '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif';

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: PALETTE.canvas },
        textColor: PALETTE.ink3,
        fontFamily: uiFontFamily,
        fontSize: 12,
        attributionLogo: false,
        panes: {
          separatorColor: PALETTE.line,
          separatorHoverColor: PALETTE.lineStrong,
        },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: mix(PALETTE.ink, 0.04), style: LineStyle.Solid },
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
        scaleMargins: { top: 0.08, bottom: 0.1 },
      },
      timeScale: {
        borderColor: PALETTE.line,
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
        rightOffset: 2,
      },
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
      priceLineColor: mix(PALETTE.signal, 0.35),
      priceLineWidth: 1,
      priceLineStyle: LineStyle.Dashed,
      lastValueVisible: false,
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

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: PALETTE.ink3,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      priceLineVisible: false,
      lastValueVisible: false,
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    const volOpacity = isDark ? 0.18 : 0.22;
    volumeSeries.setData(
      data.candles.map((c) => ({
        time: c.time as unknown as Time,
        value: c.volume ?? 0,
        color: c.close >= c.open ? mix(PALETTE.up, volOpacity) : mix(PALETTE.down, volOpacity),
      }))
    );

    const series = data.indicators?.series;
    const mutedLine = mix(PALETTE.ink3, 0.6);

    if (showSma20 && series?.sma20) {
      const s = chart.addSeries(LineSeries, {
        color: mutedLine,
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(toLine(data.candles, series.sma20));
    }

    if (showSma50 && series?.sma50) {
      const s = chart.addSeries(LineSeries, {
        color: mutedLine,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(toLine(data.candles, series.sma50));
    }

    if (showBb && series?.bollinger) {
      const upper = chart.addSeries(LineSeries, {
        color: mix(PALETTE.ink3, 0.5),
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const lower = chart.addSeries(LineSeries, {
        color: mix(PALETTE.ink3, 0.5),
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const mid = chart.addSeries(LineSeries, {
        color: mix(PALETTE.ink3, 0.3),
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
    const containerWidth = containerRef.current.clientWidth;
    const naturalSpacing = containerWidth / (data.candles.length - 1 || 1);
    const isNarrowViewport = typeof window !== 'undefined' && window.innerWidth < 640;
    const minSpacing = isNarrowViewport ? 6 : 8;
    if (naturalSpacing < minSpacing) {
      // Too many bars to fit the viewport legibly — hold a minimum bar
      // width and show the most recent bars instead of cramming everything in.
      chart.timeScale().applyOptions({ barSpacing: minSpacing });
      chart.timeScale().scrollToRealTime();
    } else if (naturalSpacing > 8) {
      chart.timeScale().applyOptions({ barSpacing: 8 });
    }

    const lastCandle = data.candles[data.candles.length - 1];
    const y = lastCandle ? candleSeries.priceToCoordinate(lastCandle.close) : null;
    setPriceTag(
      lastCandle && y != null
        ? {
            top: y,
            color: lastCandle.close >= lastCandle.open ? PALETTE.up : PALETTE.down,
            text: lastCandle.close.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
          }
        : null
    );

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
      setPriceTag(null);
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

  return (
    <div className={cn('relative w-full', className)}>
      <div ref={containerRef} className="w-full" />
      {priceTag ? (
        <div
          aria-hidden
          className="num pointer-events-none absolute right-1.5 text-[11px] font-semibold"
          style={{ top: priceTag.top, transform: 'translateY(-50%)', color: priceTag.color }}
        >
          {priceTag.text}
        </div>
      ) : null}
    </div>
  );
}
