'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

type CountUpProps = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
};

function format(value: number, decimals: number, prefix: string, suffix: string) {
  return `${prefix}${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
}

/**
 * React Bits-style smooth number interpolation. Renders the final formatted
 * value for SSR/no-JS, then tweens from the previous value to the next with
 * GSAP whenever `value` changes (including the first client mount).
 */
export function CountUp({ value, decimals = 0, prefix = '', suffix = '', duration = 0.9, className = '' }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const previousValue = useRef(value);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const hasMounted = useRef(false);

  useEffect(() => {
    const from = hasMounted.current ? previousValue.current : 0;
    hasMounted.current = true;
    previousValue.current = value;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }

    const obj = { val: from };
    tweenRef.current?.kill();
    tweenRef.current = gsap.to(obj, {
      val: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => setDisplay(obj.val),
    });

    return () => {
      tweenRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`} suppressHydrationWarning>
      {format(display, decimals, prefix, suffix)}
    </span>
  );
}
