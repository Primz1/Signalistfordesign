export type Point = { x: number; y: number };

/** Returns true if cursor `p` is inside triangle (a, b, c) using barycentric sign check. */
export function isPointInSafeTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const sign = (p1: Point, p2: Point, p3: Point) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, a, b);
  const d2 = sign(p, b, c);
  const d3 = sign(p, c, a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export type RectLike = Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>;

/** Triangle from the last cursor point to the menu edge that faces that point. */
export function corridorToRect(from: Point, rect: RectLike): [Point, Point, Point] {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = cx - from.x;
  const dy = cy - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const x = dx > 0 ? rect.left : rect.right;
    return [from, { x, y: rect.top }, { x, y: rect.bottom }];
  }
  const y = dy > 0 ? rect.top : rect.bottom;
  return [from, { x: rect.left, y }, { x: rect.right, y }];
}

export function pointInRect(p: Point, rect: RectLike): boolean {
  return p.x >= rect.left && p.x <= rect.right && p.y >= rect.top && p.y <= rect.bottom;
}
