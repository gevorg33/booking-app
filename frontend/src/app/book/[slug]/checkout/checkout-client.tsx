'use client';

import { PublicHeader } from '@/components/public-booking/public-header';
import { CheckoutForm } from '@/components/public-booking/checkout-form';
import type { PublicBusinessProfile, PublicService } from '@/lib/public-api';

interface CheckoutClientProps {
  tenant: PublicBusinessProfile;
  employee: { id: string; name: string; role?: string };
  service: PublicService;
  startTime: string;
  backHref: string;
}

export function CheckoutClient({ tenant, employee, service, startTime, backHref }: CheckoutClientProps) {
  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6">
        <CheckoutForm tenant={tenant} employee={employee} service={service} startTime={startTime} />
      </main>
    </>
  );
}
