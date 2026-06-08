'use client';

import { useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { PublicBookingAssistant } from '@/components/public-booking/public-booking-assistant';
import { buildPublicAssistantPageContext } from '@/lib/public-assistant-page-context.util';
import type { PublicBusinessProfile } from '@/lib/public-api';

export function PublicBookingAssistantHost({
  slug,
  tenant,
}: {
  slug: string;
  tenant: PublicBusinessProfile;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageContext = useMemo(
    () => buildPublicAssistantPageContext({ pathname, searchParams }),
    [pathname, searchParams],
  );

  return <PublicBookingAssistant slug={slug} tenant={tenant} pageContext={pageContext} />;
}
