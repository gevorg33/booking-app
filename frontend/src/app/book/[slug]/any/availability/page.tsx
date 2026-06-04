import { redirect } from 'next/navigation';
import { getPublicProfile, getPublicServices } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { getServerLocale } from '@/lib/server-locale';
import { AnyAvailabilityClient } from './any-availability-client';

export default async function AnyAvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string }>;
}) {
  const { slug } = await params;
  const { serviceId } = await searchParams;

  if (!serviceId) {
    redirect(bookPath(slug, '/any'));
  }

  const locale = await getServerLocale();
  const [tenant, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicServices(slug, { locale }),
  ]);

  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    redirect(bookPath(slug, '/any'));
  }

  return (
    <AnyAvailabilityClient
      slug={slug}
      tenant={tenant}
      service={service}
      backHref={bookPath(slug, '/any')}
    />
  );
}
