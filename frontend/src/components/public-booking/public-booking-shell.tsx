'use client';

import { PublicCustomerAuthProvider } from '@/lib/public-customer-auth';
import { ConsumerAppBanner } from '@/components/public-booking/consumer-app-banner';
import { resolvePublicBookingDeferredInstallFields } from '@/lib/consumer-app-banner.util';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';

export function PublicBookingShell({ slug, children }: { slug: string; children: ReactNode }) {
  const searchParams = useSearchParams();
  const deferredFields = resolvePublicBookingDeferredInstallFields({
    serviceId: searchParams.get('serviceId'),
    services: searchParams.get('services'),
    date: searchParams.get('date'),
    slot: searchParams.get('slot'),
    employeeId: searchParams.get('employeeId'),
  });

  return (
    <PublicCustomerAuthProvider slug={slug}>
      <ConsumerAppBanner slug={slug} {...deferredFields} />
      {children}
    </PublicCustomerAuthProvider>
  );
}
