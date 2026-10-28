/**
 * Hex mirrors of the CSS tokens in app/globals.css, for canvas libraries that
 * cannot read CSS variables reliably. Prefer readPalette() in the browser so
 * charts follow the active light or dark theme.
 */
export const PALETTE = {
  canvas: '#050811',
  surface: '#0B1021',
  surface2: '#131B31',
  surface3: '#192340',
  line: 'rgba(148, 163, 210, 0.14)',
  lineStrong: 'rgba(99, 130, 255, 0.32)',
  ink: '#F4F7FF',
  ink2: '#A3B1D2',
  ink3: '#68779C',
  signal: '#CCFF00',
  signalInk: '#050811',
  up: '#10B981',
  down: '#FF3B69',
  warm: '#FF5500',
  cobalt: '#3B63FF',
  cyan: '#00F0FF',
  violet: '#8B5CF6',
} as const;

export const PALETTE_LIGHT = {
  canvas: '#F4F3EC',
  surface: '#FFFFFF',
  surface2: '#EAE6DA',
  surface3: '#E0DACB',
  line: 'rgba(28, 25, 23, 0.1)',
  lineStrong: 'rgba(26, 54, 255, 0.24)',
  ink: '#0F1322',
  ink2: '#434A5E',
  ink3: '#6E758A',
  signal: '#1A36FF',
  signalInk: '#FFFFFF',
  up: '#059669',
  down: '#E11D48',
  warm: '#FF4500',
  cobalt: '#1A36FF',
  cyan: '#0891B2',
  violet: '#6D28D9',
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
    warm: pick('--sg-warm', fallback.warm),
    cobalt: pick('--sg-cobalt', fallback.cobalt),
    cyan: pick('--sg-cyan', fallback.cyan),
    violet: pick('--sg-violet', fallback.violet),
  };
}

/** Multi-tonal complementary series — Acid Lime, Cobalt, Cyan, Violet, Orange, Emerald, Coral. */
export const SERIES = ['#CCFF00', '#3B63FF', '#00F0FF', '#8B5CF6', '#FF5500', '#10B981', '#FF3B69'];
