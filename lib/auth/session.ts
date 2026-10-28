import { cache } from 'react';
import { headers } from 'next/headers';

/** One session lookup per React request — shared across layout + all server actions. */
export const getCachedSession = cache(async () => {
  if (!process.env.MONGODB_URI) return null;
  try {
    const { auth } = await import('@/lib/better-auth/auth');
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
});

export const getCachedUser = cache(async () => {
  const session = await getCachedSession();
  return session?.user ?? null;
});
