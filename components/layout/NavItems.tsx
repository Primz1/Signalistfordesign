'use client';

import { NAV_ITEMS } from '@/lib/constants';
import Link from 'next/link';
import { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

function NavPendingDot() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      className="ml-2 inline-block size-1 shrink-0 animate-pulse-soft rounded-full bg-ink"
      aria-hidden
    />
  );
}

const NavItems = ({
  className,
  itemClassName,
  variant = 'rail',
}: {
  className?: string;
  itemClassName?: string;
  variant?: 'rail' | 'tabs';
}) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (pathname.startsWith('/preview')) {
      const leaf = pathname.split('/').filter(Boolean)[1] || 'dashboard';
      if (path === '/dashboard') return leaf === 'dashboard';
      if (path === '/stocks') return leaf === 'stock';
      return path.replace(/^\//, '') === leaf;
    }
    if (path === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname.startsWith(path);
  };

  if (variant === 'tabs') {
    return (
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  prefetch
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'press flex h-16 items-center justify-center px-1 text-center text-xs leading-tight',
                    active ? 'font-semibold text-ink' : 'text-ink-3'
                  )}
                >
                  {label}
                  <NavPendingDot />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <ul className={cn('flex h-16 items-center gap-1', className)}>
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <li key={href} className="flex h-full items-center">
            <Link
              href={href}
              prefetch
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm',
                active ? 'bg-surface-2 font-semibold text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                itemClassName
              )}
            >
              {label}
              <NavPendingDot />
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;
