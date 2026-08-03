import { getPublicProfileResolved } from '@/lib/get-public-profile-resolved';
import {
  getPublicProviders,
  getPublicServices,
  getPublicServicesForSlot,
} from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { resolvePublicBookingLocale } from '@/lib/server-public-locale';
import { ServicesClient } from './services-client';
import { ServicesCatalogClient } from './services-catalog-client';

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    employeeId?: string | string[];
    startTime?: string | string[];
    category?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const employeeId = pickParam(raw.employeeId);
  const startTime = pickParam(raw.startTime);
  const category = pickParam(raw.category);

  const tenant = await getPublicProfileResolved(slug);
  const locale = await resolvePublicBookingLocale(tenant.locale);

  // e2e-bug.208 — bare `/services` is full-catalog browse (no hard redirect).
  if (!employeeId || !startTime) {
    const { services } = await getPublicServices(slug, { locale }).catch(() => ({
      services: [],
    }));
    return (
      <ServicesCatalogClient
        slug={slug}
        tenant={tenant}
        services={services}
        backHref={bookPath(slug)}
        initialCategoryId={category ?? null}
      />
    );
  }

  const [{ providers }, { services }] = await Promise.all([
    getPublicProviders(slug, undefined, locale),
    getPublicServicesForSlot(slug, employeeId, startTime, locale),
  ]);

  const provider = providers.find((p) => p.id === employeeId);

  return (
    <ServicesClient
      slug={slug}
      tenant={tenant}
      services={services}
      employeeId={employeeId}
      startTime={startTime}
      employeeName={provider?.name || 'Professional'}
      backHref={`${bookPath(slug, '/professionals')}?employeeId=${encodeURIComponent(employeeId)}&startTime=${encodeURIComponent(startTime)}`}
      initialCategoryId={category ?? null}
    />
  );
}
