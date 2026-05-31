import { getPublicProfile, getPublicServices } from '@/lib/public-api';
import { buildMultiServicePickerHref, parseMultiServiceIds } from '@/lib/multi-service-booking';
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
  const serviceIds = servicesParam ? parseMultiServiceIds(servicesParam) : [];

  const [tenant, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicServices(slug),
  ]);

  return (
    <MultiServiceConfirmClient
      slug={slug}
      tenant={tenant}
      services={services}
      backHref={buildMultiServicePickerHref(slug, serviceIds)}
    />
  );
}
