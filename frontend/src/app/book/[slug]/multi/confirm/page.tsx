import { getPublicProfile, getPublicServices } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { MultiServiceConfirmClient } from '@/components/public-booking/multi-service-confirm-client';

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function MultiServiceConfirmPage({
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

  const backQuery = servicesParam ? `?services=${encodeURIComponent(servicesParam)}` : '';

  return (
    <MultiServiceConfirmClient
      slug={slug}
      tenant={tenant}
      services={filtered}
      backHref={`${bookPath(slug, '/any')}${backQuery}`}
    />
  );
}
