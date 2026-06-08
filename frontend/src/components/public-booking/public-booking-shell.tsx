'use client';

import { PublicCustomerAuthProvider } from '@/lib/public-customer-auth';
import { ConsumerAppBanner } from '@/components/public-booking/consumer-app-banner';
import { PublicReferralCapture } from '@/components/public-booking/public-referral-capture';
import type { ReactNode } from 'react';

export function PublicBookingShell({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <PublicCustomerAuthProvider slug={slug}>
      <PublicReferralCapture slug={slug} />
      <ConsumerAppBanner slug={slug} />
      {children}
    </PublicCustomerAuthProvider>
  );
}
