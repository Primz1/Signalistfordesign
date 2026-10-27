'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

/** Instant theme switch. No motion — this control is used often. */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={dark ? 'Use light mode' : 'Use dark mode'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      className="press flex size-11 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
    >
      {dark ? <Sun className="size-4" strokeWidth={1.5} /> : <Moon className="size-4" strokeWidth={1.5} />}
    </button>
  );
}
