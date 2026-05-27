'use client';

import { useState } from 'react';
import { PublicHeader } from '@/components/public-booking/public-header';
import { ServiceList } from '@/components/public-booking/service-list';
import type { PublicBusinessProfile, PublicService } from '@/lib/public-api';

interface ServicesClientProps {
  slug: string;
  tenant: PublicBusinessProfile;
  services: PublicService[];
  employeeId: string;
  startTime: string;
  employeeName: string;
  backHref: string;
}

export function ServicesClient({
  slug,
  tenant,
  services,
  employeeId,
  startTime,
  backHref,
}: ServicesClientProps) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const primary = tenant.branding.primaryColor || '#7c3aed';

  return (
    <>
      <PublicHeader tenant={tenant} showBack backHref={backHref} />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Select services</h1>
        <ServiceList
          slug={slug}
          services={services}
          primaryColor={primary}
          selectedServiceId={serviceId}
          onSelect={setServiceId}
          employeeId={employeeId}
          startTime={startTime}
        />
      </main>
    </>
  );
}
