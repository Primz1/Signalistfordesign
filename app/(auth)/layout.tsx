import BrandLogo from '@/components/layout/BrandLogo';
import { AlertLevelChart } from '@/components/marketing/AlertLevelChart';
import { getCachedSession } from '@/lib/auth/session';
import { getMarketingLiveData } from '@/lib/marketing/live-data';
import { redirect } from 'next/navigation';
import { AuroraCanvas, SplitText, SpotlightCard } from '@/components/motion';
import { MarketStatus } from '@/components/terminal/MarketStatus';

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getCachedSession();

  if (session?.user) redirect('/dashboard');

  const data = await getMarketingLiveData();

  return (
    <main className="auth-layout">
      <section className="auth-left-section scrollbar-hide-default">
        <div className="auth-logo">
          <BrandLogo href="/" />
        </div>
        <div className="relative z-10 flex flex-1 items-center">
          <div className="surface-card mx-auto w-full max-w-[420px] p-6 pb-8 sm:p-8 lg:mx-0">{children}</div>
        </div>
        <p className="text-sm text-ink-3">Paper money only. Nothing here is investment advice.</p>
      </section>

      <section className="auth-right-section animate-hero relative justify-between gap-12 overflow-hidden p-8 xl:p-12">
        <AuroraCanvas />
        <div className="bg-grid-stage absolute inset-0" />

        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <MarketStatus />
        </div>

        <div className="relative z-10">
          <SplitText
            as="h2"
            text="Your levels, watched for you."
            className="font-display max-w-[16ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink xl:text-[48px] xl:tracking-[-0.04em]"
          />
        </div>

        {data.heroCandles.length > 20 ? (
          <SpotlightCard spotlightColor="cyan" className="relative z-10 p-5">
            <AlertLevelChart symbol={data.hero.symbol} candles={data.heroCandles} />
          </SpotlightCard>
        ) : (
          <p className="relative z-10 max-w-[40ch] text-base leading-normal text-ink-2">
            Set an upper or lower price on any stock or crypto. Signalist checks it in the
            background and tells you the moment it crosses.
          </p>
        )}
      </section>
    </main>
  );
};

export default layout;
