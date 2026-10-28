'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

type Orb = {
  color: string;
  size: number;
  top: string;
  left: string;
  floatX: number;
  floatY: number;
  duration: number;
};

const ORBS: Orb[] = [
  { color: 'var(--sg-cobalt)', size: 420, top: '-8%', left: '8%', floatX: 40, floatY: 30, duration: 9 },
  { color: 'var(--sg-cyan)', size: 320, top: '10%', left: '68%', floatX: -30, floatY: 40, duration: 11 },
  { color: 'var(--sg-signal)', size: 280, top: '58%', left: '22%', floatX: 26, floatY: -24, duration: 8.5 },
  { color: 'var(--sg-violet)', size: 260, top: '46%', left: '78%', floatX: -24, floatY: -30, duration: 10 },
];

/**
 * Animated multi-palette aurora mesh + perspective grid stage for hero
 * sections. Floating blurred orbs drift via GSAP, with a faint pulse-line
 * sweep layered on top of the architectural grid. Orbs hold still when the
 * user prefers reduced motion.
 */
export function AuroraCanvas({ className = '' }: { className?: string }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = stageRef.current;
      if (!el) return;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const orbs = el.querySelectorAll<HTMLDivElement>('[data-orb]');
      orbs.forEach((orb, i) => {
        const config = ORBS[i];
        gsap.to(orb, {
          x: config.floatX,
          y: config.floatY,
          duration: config.duration,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });
      });

      const lines = el.querySelectorAll<SVGLineElement>('[data-pulse-line]');
      gsap.to(lines, {
        opacity: 0.5,
        duration: 2.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.4,
      });
    },
    { scope: stageRef },
  );

  return (
    <div ref={stageRef} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="bg-grid-stage absolute inset-0 opacity-40" />
      {ORBS.map((orb, i) => (
        <div
          key={i}
          data-orb
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            top: orb.top,
            left: orb.left,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            opacity: 0.35,
          }}
        />
      ))}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <line data-pulse-line x1="0%" y1="30%" x2="100%" y2="22%" stroke="var(--sg-cyan)" strokeOpacity={0.15} strokeWidth={1} />
        <line data-pulse-line x1="0%" y1="70%" x2="100%" y2="78%" stroke="var(--sg-signal)" strokeOpacity={0.12} strokeWidth={1} />
      </svg>
    </div>
  );
}
