import { notFound } from 'next/navigation';
import { getPublicProfile, getPublicProviderReviews, getPublicProviders } from '@/lib/public-api';
import { getServerLocale } from '@/lib/server-locale';
import { bookPath } from '@/lib/tenant-host';
import { ProviderProfileClient } from './provider-profile-client';

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string; employeeId: string }>;
}) {
  const { slug, employeeId } = await params;
  const locale = await getServerLocale();

  let tenant;
  let providers;
  let reviews;
  try {
    [tenant, { providers }, reviews] = await Promise.all([
      getPublicProfile(slug),
      getPublicProviders(slug, undefined, locale),
      getPublicProviderReviews(slug, employeeId, 1),
    ]);
  } catch {
    notFound();
  }

  const provider = providers.find((p) => p.id === employeeId);
  if (!provider) notFound();

  return (
    <ProviderProfileClient
      slug={slug}
      tenant={tenant}
      provider={provider}
      reviews={reviews}
      backHref={bookPath(slug)}
    />
  );
}
