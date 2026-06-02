'use client';

import { PublicCustomerAuthProvider } from '@/lib/public-customer-auth';
import { ConsumerAppBanner } from '@/components/public-booking/consumer-app-banner';
import type { ReactNode } from 'react';

export function PublicBookingShell({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <PublicCustomerAuthProvider slug={slug}>
      <ConsumerAppBanner slug={slug} />
      {children}
    </PublicCustomerAuthProvider>
  );
}
