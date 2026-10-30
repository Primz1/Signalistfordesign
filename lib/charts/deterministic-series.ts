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
  const amplitude = Math.max(0.01, Math.abs(safeEnd)) * 0.012;

  // A correlated random walk (each step nudges off the last, with gentle
  // mean reversion) reads like a real price trail. Independent per-point
  // noise, by contrast, forces the curve to arc between every point and
  // looks like a sine wave once smoothed.
  const offsets: number[] = [];
  let drift = 0;
  for (let i = 0; i < length; i++) {
    drift = drift * 0.85 + (rand(i) - 0.5) * amplitude;
    offsets.push(drift);
  }

  // One light moving-average pass rounds off the remaining jaggedness.
  const smoothed = offsets.map((_, i) => {
    const lo = Math.max(0, i - 1);
    const hi = Math.min(offsets.length - 1, i + 1);
    let sum = 0;
    for (let j = lo; j <= hi; j++) sum += offsets[j];
    return sum / (hi - lo + 1);
  });

  const out = smoothed.map((offset, i) => {
    const t = i / (length - 1 || 1);
    const trend = startValue + (safeEnd - startValue) * t;
    return trend + offset;
  });
  out[out.length - 1] = safeEnd;
  return out;
}
