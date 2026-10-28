import { describe, expect, it } from 'vitest';
import { corridorToRect, isPointInSafeTriangle } from './safe-triangle';

describe('isPointInSafeTriangle', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 100, y: 0 };
  const c = { x: 100, y: 80 };

  it('accepts a point inside the corridor', () => {
    expect(isPointInSafeTriangle({ x: 60, y: 20 }, a, b, c)).toBe(true);
  });

  it('rejects a point outside the corridor', () => {
    expect(isPointInSafeTriangle({ x: 10, y: 70 }, a, b, c)).toBe(false);
  });

  it('keeps the vertices themselves inside', () => {
    expect(isPointInSafeTriangle(a, a, b, c)).toBe(true);
    expect(isPointInSafeTriangle(b, a, b, c)).toBe(true);
  });
});

describe('corridorToRect', () => {
  it('aims at the left edge when the cursor is left of the menu', () => {
    const rect = { left: 200, top: 40, width: 160, height: 120, right: 360, bottom: 160 };
    const [from, top, bottom] = corridorToRect({ x: 40, y: 90 }, rect);
    expect(from).toEqual({ x: 40, y: 90 });
    expect(top).toEqual({ x: 200, y: 40 });
    expect(bottom).toEqual({ x: 200, y: 160 });
    expect(isPointInSafeTriangle({ x: 120, y: 90 }, from, top, bottom)).toBe(true);
  });
});
