import { getPublicProfile, getPublicServices } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { getServerLocale } from '@/lib/server-locale';
import { buildMultiServicePickerHref, parseMultiServiceIds } from '@/lib/multi-service-booking';
import { MultiServiceAvailabilityClient } from '@/components/public-booking/multi-service-availability-client';

export const dynamic = 'force-dynamic';

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
  const serviceIds = servicesParam ? parseMultiServiceIds(servicesParam) : [];

  const locale = await getServerLocale();
  const [tenant, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicServices(slug, { locale }),
  ]);

  return (
    <MultiServiceAvailabilityClient
      slug={slug}
      tenant={tenant}
      services={services}
      serviceIds={serviceIds}
      backHref={buildMultiServicePickerHref(slug, serviceIds)}
    />
  );
}
