import { Suspense } from 'react';
import { getPublicProfile, getPublicProviders } from '@/lib/public-api';
import { getServerLocale } from '@/lib/server-locale';
import { HomeClient } from './home-client';

export default async function PublicBookingHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getServerLocale();
  const [tenant, { providers }] = await Promise.all([
    getPublicProfile(slug),
    getPublicProviders(slug, undefined, locale),
  ]);

  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto px-4 py-12 text-center text-gray-500">Loading…</div>
      }
    >
      <HomeClient slug={slug} tenant={tenant} providers={providers} />
    </Suspense>
  );
}
