import BrandLogo from '@/components/layout/BrandLogo';
import { AlertLevelChart } from '@/components/marketing/AlertLevelChart';
import { getCachedSession } from '@/lib/auth/session';
import { getMarketingLiveData } from '@/lib/marketing/live-data';
import { redirect } from 'next/navigation';

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
          <div className="mx-auto w-full max-w-[400px] pb-10 lg:mx-0">{children}</div>
        </div>
        <p className="text-sm text-ink-3">Paper money only. Nothing here is investment advice.</p>
      </section>

      <section className="auth-right-section animate-hero justify-between gap-12 p-8 xl:p-12">
        <h2 className="font-display max-w-[16ch] text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-ink xl:text-[48px] xl:tracking-[-0.04em]">
          Your levels, watched for you.
        </h2>
        {data.heroCandles.length > 20 ? (
          <AlertLevelChart symbol={data.hero.symbol} candles={data.heroCandles} />
        ) : (
          <p className="max-w-[40ch] text-base leading-normal text-ink-2">
            Set an upper or lower price on any stock or crypto. Signalist checks it in the
            background and tells you the moment it crosses.
          </p>
        )}
      </section>
    </main>
  );
};

export default layout;
