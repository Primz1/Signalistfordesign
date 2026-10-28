/**
 * Generates a plausible-looking price trail ending exactly at `endValue`,
 * seeded by a string key so the same symbol always renders the same curve.
 * Used for sparkline decoration when we don't have historical OHLCV on hand
 * (e.g. watchlist rows, dashboard KPI cards).
 */
export function deterministicSeries(
  seed: string,
  length: number,
  endValue: number,
  changePct = 0
): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;

  const rand = (i: number) => {
    const x = Math.sin(hash + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const safeEnd = Number.isFinite(endValue) ? endValue : 100;
  const startValue = safeEnd / (1 + changePct / 100 || 1);

  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const t = i / (length - 1 || 1);
    const trend = startValue + (safeEnd - startValue) * t;
    const noise = (rand(i) - 0.5) * Math.max(0.01, Math.abs(safeEnd)) * 0.02;
    out.push(trend + noise);
  }
  out[out.length - 1] = safeEnd;
  return out;
}
