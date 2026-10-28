import Header from '@/components/layout/Header';
import { redirect } from 'next/navigation';
import { getCachedSession } from '@/lib/auth/session';

const layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await getCachedSession();

  if (!session?.user) redirect('/sign-in');

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };

  return (
    <main className="min-h-dvh overflow-x-clip bg-canvas text-ink-2">
      <Header user={user} />
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-24 md:px-6 md:pt-8 md:pb-16">
        {children}
      </div>
    </main>
  );
};

export default layout;
