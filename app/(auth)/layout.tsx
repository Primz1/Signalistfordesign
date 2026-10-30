import BrandLogo from '@/components/layout/BrandLogo';
import { getCachedSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getCachedSession();

  if (session?.user) redirect('/dashboard');

  return (
    <main className="auth-layout px-6 sm:px-8">
      <div className="auth-logo pt-6 sm:pt-8">
        <BrandLogo href="/" />
      </div>

      <div className="auth-column">{children}</div>

      <p className="pb-6 text-center text-sm text-ink-3 sm:pb-8">
        Paper money only. Nothing here is investment advice.
      </p>
    </main>
  );
};

export default layout;
