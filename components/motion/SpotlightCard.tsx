'use client';

import { useRef } from 'react';
import gsap from 'gsap';

type SpotlightColor = 'cobalt' | 'lime' | 'cyan' | 'violet';

const SPOTLIGHT_COLORS: Record<SpotlightColor, string> = {
  cobalt: 'rgba(59, 99, 255, 0.35)',
  lime: 'rgba(204, 255, 0, 0.3)',
  cyan: 'rgba(0, 240, 255, 0.3)',
  violet: 'rgba(139, 92, 246, 0.32)',
};

type SpotlightCardProps = {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: SpotlightColor;
  /** Enables a subtle 3D pointer-tilt on top of the spotlight glow. */
  tilt?: boolean;
  style?: React.CSSProperties;
};

/**
 * React Bits-style cursor-tracking spotlight card. Tracks pointer position
 * into --mouse-x/--mouse-y CSS vars to drive a radial border glow and inner
 * surface illumination, with an optional GSAP quickTo 3D tilt.
 */
export function SpotlightCard({ children, className = '', spotlightColor = 'cobalt', tilt = false, style }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const quickRotateX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const quickRotateY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  function ensureQuickSetters(el: HTMLDivElement) {
    if (!quickRotateX.current) quickRotateX.current = gsap.quickTo(el, 'rotateX', { duration: 0.4, ease: 'power3.out' });
    if (!quickRotateY.current) quickRotateY.current = gsap.quickTo(el, 'rotateY', { duration: 0.4, ease: 'power3.out' });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);

    if (tilt) {
      ensureQuickSetters(el);
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;
      quickRotateY.current?.(px * 8);
      quickRotateX.current?.(-py * 8);
    }
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    if (tilt) {
      ensureQuickSetters(el);
      quickRotateX.current?.(0);
      quickRotateY.current?.(0);
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`spotlight-card group relative overflow-hidden rounded-2xl border border-[var(--sg-border-specular)] bg-[var(--sg-glass)] backdrop-blur-xl transition-transform ${className}`}
      style={{
        '--spotlight-color': SPOTLIGHT_COLORS[spotlightColor],
        boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.12), var(--sg-shadow)',
        transformStyle: tilt ? 'preserve-3d' : undefined,
        perspective: tilt ? '800px' : undefined,
        ...style,
      } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--spotlight-color), transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.14), transparent 70%)',
          mixBlendMode: 'overlay',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
