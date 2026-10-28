'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scroll synced to gsap.ticker, plus a ScrollTrigger batch that
 * reveals any [data-reveal] element with Ugoki's 3 Moves: anticipation
 * pullback, wave-offset stagger, and directional blur settling to sharp.
 * Elements that are already in view at mount animate in place instead of
 * waiting for a scroll event, and nothing stays invisible if JS is slow.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const lenis = new Lenis({
      lerp: prefersReducedMotion ? 1 : 0.1,
      smoothWheel: !prefersReducedMotion,
    });
    lenisRef.current = lenis;

    function onTick(time: number) {
      lenis.raf(time * 1000);
    }
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);
    lenis.on('scroll', ScrollTrigger.update);

    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    elements.forEach((el) => {
      el.style.opacity = '1';
      el.style.filter = 'none';
      el.style.transform = 'none';
    });

    let batchTriggers: ScrollTrigger[] = [];
    if (elements.length && !prefersReducedMotion) {
      gsap.set(elements, { opacity: 0, y: 22, filter: 'blur(6px)' });

      batchTriggers = ScrollTrigger.batch(elements, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          gsap
            .timeline()
            .to(batch, { y: 5, scale: 0.985, duration: 0.06, ease: 'power1.in' })
            .to(batch, {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
              duration: 0.6,
              ease: 'power3.out',
              stagger: 0.045,
            });
        },
      });
    }

    ScrollTrigger.refresh();

    return () => {
      batchTriggers.forEach((trigger) => trigger.kill());
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
