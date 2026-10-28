'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import BrandLogo from '@/components/layout/BrandLogo';
import NavItems from '@/components/layout/NavItems';
import ThemeToggle from '@/components/layout/ThemeToggle';
import UserDropdown from '@/components/layout/UserDropdown';
import { SearchCommand } from '@/components/search/SearchCommand';
import { markNotifications } from '@/lib/actions/alertNotification.actions';
import { useSafeTriangle } from '@/components/ui/use-safe-triangle';
import { MarketStatus } from '@/components/terminal/MarketStatus';

type Notification = {
  _id?: string;
  symbol: string;
  message: string;
  triggeredAt: string;
  read: boolean;
};

export default function AppHeader({
  user,
  initialStocks,
  watchlistSymbols,
  initialNotifications = [],
}: {
  user: User;
  initialStocks: StockWithWatchlistStatus[];
  watchlistSymbols?: string[];
  initialNotifications?: Notification[];
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const safe = useSafeTriangle(notifOpen, () => setNotifOpen(false));
  const swipe = useRef<{ y: number } | null>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await markNotifications();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="app-bar sticky top-0 z-30 border-b border-[var(--sg-border-specular)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 md:gap-6 md:px-6">
        <BrandLogo />

        <nav aria-label="Primary" className="hidden h-16 md:block">
          <NavItems />
        </nav>

        <MarketStatus className="hidden md:flex" />

        <div className="ml-auto flex flex-none items-center gap-1">
          <div className="hidden w-[260px] lg:block xl:w-[300px]">
            <SearchCommand
              renderAs="button"
              label="Search symbols"
              initialStocks={initialStocks}
              watchlistSymbols={watchlistSymbols}
              quickAddEnabled
              className="!max-w-none"
            />
          </div>
          <div className="lg:hidden">
            <SearchCommand
              renderAs="icon"
              label="Search"
              initialStocks={initialStocks}
              watchlistSymbols={watchlistSymbols}
              quickAddEnabled
            />
          </div>

          <div className="relative">
            <button
              ref={(node) => {
                safe.triggerRef.current = node;
              }}
              type="button"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen((o) => !o)}
              onPointerEnter={(event) => {
                if (event.pointerType === 'touch') return;
                safe.clearTimer();
                safe.notePoint({ x: event.clientX, y: event.clientY });
                setNotifOpen(true);
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === 'touch') return;
                safe.notePoint({ x: event.clientX, y: event.clientY });
                safe.armClose();
              }}
              className="press hit-slop relative flex size-11 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              <Bell className="size-[18px]" strokeWidth={1.5} />
              {unread > 0 && (
                <span className="mono absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-signal px-1 text-[10px] font-semibold text-signal-ink">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close notifications"
                  className="fixed inset-0 z-20 cursor-default"
                  onClick={() => setNotifOpen(false)}
                />
                <div
                  ref={(node) => {
                    safe.contentRef.current = node;
                  }}
                  onPointerEnter={() => safe.clearTimer()}
                  onPointerDown={(event) => {
                    swipe.current = { y: event.clientY };
                  }}
                  onPointerMove={(event) => {
                    if (!swipe.current) return;
                    if (event.clientY - swipe.current.y > 48) {
                      swipe.current = null;
                      setNotifOpen(false);
                    }
                  }}
                  onPointerUp={() => {
                    swipe.current = null;
                  }}
                  className="surface-card animate-toast absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-2rem))] touch-pan-y !rounded-[18px]"
                >
                  <div className="flex items-center justify-between border-b border-[var(--sg-border-specular)] px-4 py-3">
                    <div className="text-[14px] font-semibold text-ink">Alerts fired</div>
                    {unread > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[13px] text-ink-2 hover:text-ink"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6">
                        <p className="text-[14px] text-ink">Nothing has fired yet.</p>
                        <p className="mt-1 text-[13px] leading-5 text-ink-3">
                          Set an upper or lower price on any watchlist symbol and it lands here the
                          moment it crosses.
                        </p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n._id || `${n.symbol}-${n.triggeredAt}`}
                          className="flex gap-3 border-b border-[var(--sg-border-specular)] px-4 py-3 last:border-0 hover:bg-[var(--sg-glass-hover)]"
                        >
                          <span
                            aria-hidden
                            className={`mt-1.5 size-1.5 flex-none rounded-full ${n.read ? 'bg-transparent' : 'bg-signal shadow-[0_0_8px_var(--sg-signal-glow)]'}`}
                          />
                          <div className="min-w-0">
                            <div className="text-[13px] leading-5 text-ink">
                              <span className="mono font-medium">{n.symbol}</span> {n.message}
                            </div>
                            <div className="mono mt-0.5 text-[12px] text-ink-3">
                              {new Date(n.triggeredAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <Link
                    href="/watchlist"
                    onClick={() => setNotifOpen(false)}
                    className="block border-t border-[var(--sg-border-specular)] px-4 py-3 text-sm font-semibold text-ink hover:bg-[var(--sg-glass-hover)]"
                  >
                    Manage alerts
                  </Link>
                </div>
              </>
            )}
          </div>

          <ThemeToggle />
          <UserDropdown user={user} />
        </div>
      </div>

      <NavItems variant="tabs" />
    </header>
  );
}
