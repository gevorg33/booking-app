import { redirect } from 'next/navigation';
import { getPublicProfile, getPublicProviders, getPublicServicesForSlot } from '@/lib/public-api';
import { bookPath } from '@/lib/tenant-host';
import { CheckoutClient } from './checkout-client';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ employeeId?: string; startTime?: string; serviceId?: string; session_id?: string; paid?: string }>;
}) {
  const { slug } = await params;
  const { employeeId, startTime, serviceId, session_id: sessionId } = await searchParams;

  if (!employeeId || !startTime || !serviceId) {
    redirect(bookPath(slug, '/professionals'));
  }

  const [tenant, { providers }, { services }] = await Promise.all([
    getPublicProfile(slug),
    getPublicProviders(slug),
    getPublicServicesForSlot(slug, employeeId, startTime),
  ]);

  const provider = providers.find((p) => p.id === employeeId);
  const service = services.find((s) => s.id === serviceId);

  if (!service) {
    redirect(`${bookPath(slug, '/services')}?employeeId=${encodeURIComponent(employeeId)}&startTime=${encodeURIComponent(startTime)}`);
  }

  return (
    <CheckoutClient
      tenant={tenant}
      employee={{
        id: employeeId,
        name: provider?.name || 'Professional',
        role: provider?.role,
      }}
      service={service}
      startTime={startTime}
      backHref={`${bookPath(slug, '/services')}?employeeId=${encodeURIComponent(employeeId)}&startTime=${encodeURIComponent(startTime)}`}
      paymentSessionId={sessionId}
    />
  );
}
