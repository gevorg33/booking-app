'use client';

import { BusinessDateFormatBootstrap } from '@/components/business-date-format-bootstrap';
import { tenantDateFormatPreference } from '@/lib/business-date-format';
import type { PublicBusinessProfile } from '@/lib/public-api';

export function PublicDateFormatBootstrap({
  tenant,
}: {
  tenant: Pick<PublicBusinessProfile, 'dateFormat' | 'timeFormat'>;
}) {
  const { dateFormat, timeFormat } = tenantDateFormatPreference(tenant);
  return <BusinessDateFormatBootstrap dateFormat={dateFormat} timeFormat={timeFormat} />;
}
