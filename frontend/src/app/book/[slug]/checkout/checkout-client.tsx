'use client';

import { PublicHeader } from '@/components/public-booking/public-header';
import { CheckoutForm } from '@/components/public-booking/checkout-form';
import { PublicAssistantStarterChips } from '@/components/public-booking/public-assistant-starter-chips';
import type { PublicBusinessProfile, PublicService } from '@/lib/public-api';

interface CheckoutClientProps {
  tenant: PublicBusinessProfile;
  employee?: { id: string; name: string; role?: string };
  service: PublicService;
  startTime: string;
  backHref: string;
  autoAssign?: boolean;
  paymentSessionId?: string;
  clinicOrderToken?: string;
}

export function CheckoutClient({
  tenant,
  employee,
  service,
  startTime,
  backHref,
  autoAssign,
  paymentSessionId,
  clinicOrderToken,
}: CheckoutClientProps) {
  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6">
        <PublicAssistantStarterChips
          slug={tenant.slug}
          primaryColor={tenant.branding.primaryColor}
          className="mb-4"
        />
        <CheckoutForm
          tenant={tenant}
          employee={employee}
          service={service}
          startTime={startTime}
          autoAssign={autoAssign}
          paymentSessionId={paymentSessionId}
          clinicOrderToken={clinicOrderToken}
        />
      </main>
    </>
  );
}
