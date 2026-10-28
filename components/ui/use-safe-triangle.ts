'use client';

import { useCallback, useEffect, useRef } from 'react';
import { corridorToRect, isPointInSafeTriangle, pointInRect, type Point } from '@/lib/ui/safe-triangle';

/**
 * Amazon safe-triangle hover corridor.
 * Leaving a trigger does not close the flyout while the pointer is still
 * traveling through the triangle toward the menu. The close timer is cleared
 * if the pointer re-enters, so the motion stays interruptible.
 */
export function useSafeTriangle(open: boolean, close: () => void, delay = 120) {
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const anchor = useRef<Point | null>(null);
  const timer = useRef<number | null>(null);
  const closeRef = useRef(close);
  closeRef.current = close;

  const clearTimer = useCallback(() => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const armClose = useCallback(() => {
    clearTimer();
    timer.current = window.setTimeout(() => {
      anchor.current = null;
      closeRef.current();
    }, delay);
  }, [clearTimer, delay]);

  const notePoint = useCallback((point: Point) => {
    anchor.current = point;
  }, []);

  useEffect(() => {
    if (!open) {
      clearTimer();
      return;
    }
    const onMove = (event: PointerEvent) => {
      const point = { x: event.clientX, y: event.clientY };
      const content = contentRef.current?.getBoundingClientRect();
      const trigger = triggerRef.current?.getBoundingClientRect();
      if ((content && pointInRect(point, content)) || (trigger && pointInRect(point, trigger))) {
        clearTimer();
        anchor.current = point;
        return;
      }
      const from = anchor.current;
      if (from && content && isPointInSafeTriangle(point, ...corridorToRect(from, content))) {
        clearTimer();
        return;
      }
      if (from) armClose();
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      clearTimer();
    };
  }, [open, armClose, clearTimer]);

  return { triggerRef, contentRef, anchor, clearTimer, armClose, notePoint };
}
