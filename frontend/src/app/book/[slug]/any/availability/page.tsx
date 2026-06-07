import { redirect } from 'next/navigation';
import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import { getPublicServices } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { AnyAvailabilityClient } from './any-availability-client';

export default async function AnyAvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string; clinicOrderToken?: string }>;
}) {
  const { slug } = await params;
  const { serviceId, clinicOrderToken } = await searchParams;

  if (!serviceId) {
    redirect(bookPath(slug, '/any'));
  }

  const tenant = await getPublicProfileResolved(slug);
  const locale = await resolvePublicBookingLocale(tenant.locale);
  const { services } = await getPublicServices(slug, { locale });

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
      clinicOrderToken={clinicOrderToken}
    />
  );
}
