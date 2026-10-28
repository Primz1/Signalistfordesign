'use client';

import { useRef } from 'react';
import gsap from 'gsap';

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  /** Pixel radius within which the cursor pulls the button. */
  radius?: number;
  /** Max pixel offset the button can be dragged toward the cursor. */
  strength?: number;
  onClick?: () => void;
};

/**
 * React Bits-style magnetic cursor-pull wrapper. Pulls its child toward the
 * cursor within `radius` using GSAP quickTo, and snaps back elastically on
 * mouseleave.
 */
export function MagneticButton({ children, className = '', radius = 90, strength = 0.4, onClick }: MagneticButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const quickX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const quickY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  function ensureQuickSetters(el: HTMLDivElement) {
    if (!quickX.current) quickX.current = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
    if (!quickY.current) quickY.current = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) return;

    ensureQuickSetters(el);
    quickX.current?.(dx * strength);
    quickY.current?.(dy * strength);
  }

  function handleMouseLeave() {
    const el = wrapperRef.current;
    if (!el) return;
    ensureQuickSetters(el);
    gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  }

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
