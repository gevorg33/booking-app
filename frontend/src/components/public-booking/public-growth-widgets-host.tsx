'use client';

import type { PublicBusinessProfile } from '@/lib/public-api';
import { PublicGrowthWidgets } from '@/components/public-booking/public-growth-widgets';

export function PublicGrowthWidgetsHost({ tenant }: { tenant: PublicBusinessProfile }) {
  return (
    <PublicGrowthWidgets
      zendeskWidgetKey={tenant.support?.zendeskWidgetKey}
      metaBooking={tenant.metaBooking}
      messaging={tenant.messaging}
    />
  );
}
