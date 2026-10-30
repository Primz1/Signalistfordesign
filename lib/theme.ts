/**
 * Hex mirrors of the CSS tokens in app/globals.css, for canvas libraries that
 * cannot read CSS variables reliably. Prefer readPalette() in the browser so
 * charts follow the active light or dark theme.
 */
export const PALETTE = {
  canvas: '#0a0a0a',
  surface: '#141414',
  surface2: '#1c1c1e',
  surface3: '#242426',
  line: 'rgba(255, 255, 255, 0.07)',
  lineStrong: 'rgba(255, 255, 255, 0.14)',
  ink: '#f5f5f5',
  ink2: '#a1a1a6',
  ink3: '#8e8e93',
  signal: '#c6f432',
  signalInk: '#0a0a0a',
  up: '#30d158',
  down: '#ff453a',
  warm: '#ff5500',
} as const;

export const PALETTE_LIGHT = {
  canvas: '#ffffff',
  surface: '#f5f5f7',
  surface2: '#ececee',
  surface3: '#e3e3e6',
  line: 'rgba(0, 0, 0, 0.08)',
  lineStrong: 'rgba(0, 0, 0, 0.14)',
  ink: '#111111',
  ink2: '#3c3c43',
  ink3: '#6e6e73',
  signal: '#4d7c0f',
  signalInk: '#ffffff',
  up: '#15803d',
  down: '#d92d20',
  warm: '#ff4500',
} as const;

export type Palette = { -readonly [K in keyof typeof PALETTE]: string };

/** Resolved colors for the active theme. Falls back to the dark hex set. */
export function readPalette(): Palette {
  const fallback: Palette = { ...(typeof document !== 'undefined' && !document.documentElement.classList.contains('dark') ? PALETTE_LIGHT : PALETTE) };
  if (typeof window === 'undefined') return fallback;
  const cs = getComputedStyle(document.documentElement);
  const pick = (cssVar: string, fallbackValue: string) => cs.getPropertyValue(cssVar).trim() || fallbackValue;
  return {
    canvas: pick('--sg-canvas', fallback.canvas),
    surface: pick('--sg-surface', fallback.surface),
    surface2: pick('--sg-surface-2', fallback.surface2),
    surface3: pick('--sg-surface-3', fallback.surface3),
    line: pick('--sg-line', fallback.line),
    lineStrong: pick('--sg-line-strong', fallback.lineStrong),
    ink: pick('--sg-ink', fallback.ink),
    ink2: pick('--sg-ink-2', fallback.ink2),
    ink3: pick('--sg-ink-3', fallback.ink3),
    signal: pick('--sg-signal', fallback.signal),
    signalInk: pick('--sg-signal-ink', fallback.signalInk),
    up: pick('--sg-up', fallback.up),
    down: pick('--sg-down', fallback.down),
    warm: fallback.warm,
  };
}

/** Neutral + single-accent series for multi-slice charts (sector/holding donuts). Lime accent
 * on the lead slice, tonal grays for the rest — no extra hues. */
export const SERIES = [
  'var(--sg-signal)',
  'var(--sg-ink-2)',
  'var(--sg-line-strong)',
  'var(--sg-ink-3)',
  'color-mix(in oklch, var(--sg-signal) 45%, var(--sg-ink-3))',
  'var(--sg-surface-3)',
];
