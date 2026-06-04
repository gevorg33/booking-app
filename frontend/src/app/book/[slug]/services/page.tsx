import { redirect } from 'next/navigation';
import { getPublicProfile, getPublicProviders, getPublicServicesForSlot } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { getServerLocale } from '@/lib/server-locale';
import { ServicesClient } from './services-client';

function pickParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ employeeId?: string | string[]; startTime?: string | string[] }>;
}) {
  const { slug } = await params;
  const raw = await searchParams;
  const employeeId = pickParam(raw.employeeId);
  const startTime = pickParam(raw.startTime);

  if (!employeeId || !startTime) {
    redirect(bookPath(slug, '/professionals'));
  }

  const locale = await getServerLocale();
  const [tenant, { providers }, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicProviders(slug),
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
    />
  );
}
