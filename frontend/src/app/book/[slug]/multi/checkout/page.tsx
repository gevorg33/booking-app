import { getPublicProfile, getPublicServices } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { parseMultiServiceIds } from '@/lib/multi-service-booking';
import { MultiServiceCheckoutClient } from '@/components/public-booking/multi-service-checkout-client';

export const dynamic = 'force-dynamic';

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function MultiServiceCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    services?: string | string[];
    session_id?: string | string[];
    startTime?: string | string[];
    employeeId?: string | string[];
    lines?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const servicesParam = pickParam(raw.services);
  const sessionId = pickParam(raw.session_id);

  const [tenant, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicServices(slug),
  ]);

  const serviceIds = servicesParam ? parseMultiServiceIds(servicesParam) : [];

  const backQuery =
    serviceIds.length > 0 ? `?services=${encodeURIComponent(serviceIds.join(','))}` : '';
  const backHref =
    pickParam(raw.lines) != null
      ? `${bookPath(slug, '/multi/confirm')}${backQuery}`
      : `${bookPath(slug, '/multi/availability')}${backQuery}`;

  return (
    <MultiServiceCheckoutClient
      slug={slug}
      tenant={tenant}
      services={services}
      backHref={backHref}
      paymentSessionId={sessionId}
    />
  );
}
