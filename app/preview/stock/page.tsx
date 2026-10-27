import StockChartSection from '@/components/charts/StockChartSection';
import { computeIndicators, deriveSignals } from '@/lib/market/indicators';
import type { Candle } from '@/lib/market/ohlcv';

function candles(): Candle[] {
  const out: Candle[] = [];
  let price = 128;
  const start = Math.floor(Date.now() / 1000) - 90 * 86400;
  for (let i = 0; i < 90; i++) {
    const drift = Math.sin(i / 9) * 1.4 + (i % 17 === 0 ? -6.2 : 0.35);
    const open = price;
    const close = Math.max(40, open + drift);
    const high = Math.max(open, close) + 1.2;
    const low = Math.min(open, close) - 1.1;
    out.push({
      time: start + i * 86400,
      open,
      high,
      low,
      close,
      volume: 18_000_000 + (i % 5) * 1_200_000,
    });
    price = close;
  }
  return out;
}

export default function PreviewStock() {
  const series = candles();
  const indicators = computeIndicators(series);
  const signals = deriveSignals(indicators, series);
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const change = last.close - prev.close;
  const changePercent = (change / prev.close) * 100;

  return (
    <StockChartSection
      symbol="NVDA"
      company="NVIDIA Corporation Common Stock Long Legal Name"
      exchange="NASDAQ"
      isInWatchlist
      aiSummary="Price is holding above the 50-session average. The move today is +2.41% against yesterday's close, with volume in line with the last month."
      aiScore={72}
      chartData={{
        symbol: 'NVDA',
        range: '3M',
        candles: series,
        quote: {
          price: last.close,
          change,
          changePercent,
          open: last.open,
          high: last.high,
          low: last.low,
          volume: last.volume,
        },
        indicators,
        signals,
      }}
    />
  );
}
