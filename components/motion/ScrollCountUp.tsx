'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type ScrollCountUpProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

function format(value: number, decimals: number, prefix: string, suffix: string) {
  return `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

/** Like CountUp, but the tween starts once the element scrolls into view instead of on mount. */
export function ScrollCountUp({ value, decimals = 0, prefix = '', suffix = '', className = '' }: ScrollCountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplay(value);
        return;
      }
      const obj = { val: 0 };
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: value,
            duration: 1.4,
            ease: 'power3.out',
            onUpdate: () => setDisplay(obj.val),
          });
        },
      });
      return () => trigger.kill();
    },
    { scope: ref, dependencies: [value] }
  );

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {format(display, decimals, prefix, suffix)}
    </span>
  );
}
