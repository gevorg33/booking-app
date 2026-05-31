import { getPublicProfile, getPublicServices } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { MultiServiceAvailabilityClient } from '@/components/public-booking/multi-service-availability-client';

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function MultiServiceAvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ services?: string | string[] }>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const servicesParam = pickParam(raw.services);

  const [tenant, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicServices(slug),
  ]);

  const filtered = servicesParam
    ? services.filter((svc) => servicesParam.split(',').includes(svc.id))
    : services;

  return (
    <MultiServiceAvailabilityClient
      slug={slug}
      tenant={tenant}
      services={filtered}
      backHref={bookPath(slug, '/any')}
    />
  );
}
