import type { Metadata } from 'next';
import AppHeader from '@/components/layout/AppHeader';

export const metadata: Metadata = {
  title: 'Signalist preview',
  robots: { index: false, follow: false },
};

const user = {
  id: 'preview',
  name: 'Aleksandra Wiśniewska-Kowalczyk',
  email: 'aleksandra.wisniewska@northwind-holdings.example',
};

const stocks: StockWithWatchlistStatus[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: true },
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: true },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', exchange: 'NYSE', type: 'Common Stock', isInWatchlist: false },
];

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh overflow-x-clip bg-canvas text-ink-2">
      <AppHeader
        user={user}
        initialStocks={stocks}
        watchlistSymbols={['NVDA', 'AAPL', 'BRK.B']}
        initialNotifications={[
          {
            _id: '1',
            symbol: 'NVDA',
            message: 'crossed 142.50, your upper level.',
            triggeredAt: new Date().toISOString(),
            read: false,
          },
        ]}
      />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-[calc(4rem+1.5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-8 md:pb-16">{children}</div>
    </main>
  );
}
