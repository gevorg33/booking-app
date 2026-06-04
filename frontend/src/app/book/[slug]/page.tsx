import { Suspense } from 'react';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { getPublicProviders } from '@/lib/public-api';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { HomeClient } from './home-client';

export default async function PublicBookingHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicProfileResolved(slug);
  const locale = await resolvePublicBookingLocale(tenant.locale);
  const { providers } = await getPublicProviders(slug, undefined, locale);

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
