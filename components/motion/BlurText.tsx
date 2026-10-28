'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

type BlurTextProps = {
  text: string;
  as?: React.ElementType;
  className?: string;
  /** Words (case-sensitive, matched whole) to render with the gradient accent. */
  highlightWords?: string[];
  highlightClassName?: string;
  delay?: number;
};

/**
 * React Bits-style blur-to-crisp subhead/display text for secondary copy.
 * Animates the whole block (word-level stagger kept gentle) from a soft
 * directional blur to sharp focus, with optional gradient-highlighted words.
 */
export function BlurText({
  text,
  as: Tag = 'p',
  className,
  highlightWords = [],
  highlightClassName = 'bg-clip-text text-transparent bg-gradient-to-r from-[var(--sg-cobalt)] via-[var(--sg-cyan)] to-[var(--sg-signal)]',
  delay = 0,
}: BlurTextProps) {
  const containerRef = useRef<HTMLElement>(null);
  const words = text.split(' ');

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;
      const targets = el.querySelectorAll<HTMLSpanElement>('[data-blur-unit]');
      if (!targets.length) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        gsap.set(targets, { opacity: 1, y: 0, filter: 'blur(0px)' });
        return;
      }

      gsap.set(targets, { opacity: 0, y: 14, filter: 'blur(10px)' });

      gsap.timeline({
        delay,
        scrollTrigger: {
          trigger: el,
          start: 'top 90%',
          once: true,
        },
      })
        .to(targets, { y: 3, duration: 0.06, ease: 'power1.in' })
        .to(targets, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.75,
          ease: 'power3.out',
          stagger: 0.035,
        });
    },
    { scope: containerRef, dependencies: [text] },
  );

  return (
    <Tag ref={containerRef as React.Ref<HTMLElement>} className={className}>
      {words.map((word, i) => {
        const isHighlighted = highlightWords.includes(word.replace(/[.,!?]/g, ''));
        return (
          <span key={`${word}-${i}`} data-blur-unit className={`inline-block will-change-transform ${isHighlighted ? highlightClassName : ''}`}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </Tag>
  );
}
