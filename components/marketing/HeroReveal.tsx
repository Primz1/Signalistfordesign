'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { cn } from '@/lib/utils';

/**
 * Hero headline entrance: each line is masked behind overflow-hidden and
 * slides up from yPercent:100, staggered 0.08s apart, then any
 * [data-hero-rest] children (subcopy, CTAs) fade up right after. Runs once
 * on mount — the hero is always above the fold, so no ScrollTrigger needed.
 */
export function HeroReveal({
  lines,
  headingClassName,
  wrapperClassName,
  children,
}: {
  lines: string[];
  headingClassName?: string;
  wrapperClassName?: string;
  children?: React.ReactNode;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const lineEls = Array.from(el.querySelectorAll<HTMLElement>('[data-hero-line]'));
      const rest = Array.from(el.querySelectorAll<HTMLElement>('[data-hero-rest]'));

      gsap.set(lineEls, { yPercent: 100 });
      gsap.set(rest, { opacity: 0, y: 16 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.to(lineEls, { yPercent: 0, duration: 0.9, stagger: 0.08 }).to(
        rest,
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
        '-=0.4'
      );
    },
    { scope }
  );

  return (
    <div ref={scope} className={wrapperClassName}>
      <h1 className={headingClassName}>
        {lines.map((line) => (
          <span key={line} className="block overflow-hidden pb-[0.12em]">
            <span data-hero-line className="block">
              {line}
            </span>
          </span>
        ))}
      </h1>
      {children}
    </div>
  );
}
