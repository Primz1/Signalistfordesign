/**
 * Hex mirrors of the CSS tokens in app/globals.css, for canvas libraries that
 * cannot read CSS variables reliably. Prefer readPalette() in the browser so
 * charts follow the active light or dark theme.
 */
export const PALETTE = {
  canvas: '#141311',
  surface: '#1C1B17',
  surface2: '#26241F',
  surface3: '#312E28',
  line: '#3A362F',
  lineStrong: '#524C43',
  ink: '#F3F1EA',
  ink2: '#C9C3B6',
  ink3: '#A8A193',
  signal: '#E2B340',
  signalInk: '#1C1B16',
  up: '#3DDC84',
  down: '#FF7B72',
  warm: '#E0A15A',
} as const;

export const PALETTE_LIGHT = {
  canvas: '#F3F1EB',
  surface: '#FAF9F5',
  surface2: '#E8E4DB',
  surface3: '#DDD8CD',
  line: '#D5D0C4',
  lineStrong: '#B7B1A4',
  ink: '#1C1B16',
  ink2: '#3C3932',
  ink3: '#5C574C',
  signal: '#E2B340',
  signalInk: '#1C1B16',
  up: '#0B7A43',
  down: '#B42318',
  warm: '#9A5B12',
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
  };
}

/** Muted ladder for allocation charts — signal first, then warm neutrals. */
export const SERIES = ['#E2B340', '#9A5B12', '#8C8578', '#5C574C', '#3C3932', '#C9C3B6', '#A8A193'];
