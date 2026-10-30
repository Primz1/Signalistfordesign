'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger between direct children, in seconds. */
  stagger?: number;
  /** Animate direct children individually instead of the wrapper as one block. */
  items?: boolean;
};

/**
 * The one motion pattern this app uses: fade + 24px rise, 0.7s power3.out,
 * triggered once when scrolled into view. Honors prefers-reduced-motion.
 */
export function Reveal({ children, className, stagger = 0.06, items = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const targets = items ? Array.from(el.children) : [el];
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    },
    { scope: ref, dependencies: [stagger, items] }
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
