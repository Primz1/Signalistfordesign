'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

type SplitTextProps = {
  text: string;
  as?: React.ElementType;
  className?: string;
  splitBy?: 'words' | 'chars';
  delay?: number;
  once?: boolean;
};

/**
 * React Bits-style kinetic headline. Splits text into words/chars and
 * animates with Ugoki's 3 Moves: anticipation pullback (60ms), wave-offset
 * stagger (45ms/unit), and directional blur settling sharp. Renders the
 * plain string server-side so content is never hidden before JS runs.
 */
export function SplitText({ text, as: Tag = 'span', className, splitBy = 'words', delay = 0, once = true }: SplitTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const units = splitBy === 'chars' ? Array.from(text) : text.split(' ');

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;
      const targets = el.querySelectorAll<HTMLSpanElement>('[data-split-unit]');
      if (!targets.length) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        gsap.set(targets, { opacity: 1, y: 0, filter: 'blur(0px)' });
        return;
      }

      gsap.set(targets, { opacity: 0, y: 22, filter: 'blur(6px)' });

      gsap.timeline({
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once,
        },
      })
        .to(targets, { y: 5, scale: 0.985, duration: 0.06, ease: 'power1.in' })
        .to(targets, {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.045,
        });
    },
    { scope: containerRef, dependencies: [text, splitBy] },
  );

  return (
    <Tag ref={containerRef as React.Ref<HTMLElement>} className={className} aria-label={text}>
      {units.map((unit, i) => (
        <span key={`${unit}-${i}`} data-split-unit className="inline-block will-change-transform" style={{ display: splitBy === 'chars' && unit === ' ' ? 'inline' : 'inline-block' }}>
          {unit}
          {splitBy === 'words' && i < units.length - 1 ? ' ' : ''}
        </span>
      ))}
    </Tag>
  );
}
