import { PublicBookingAssistant } from '@/components/public-booking/public-booking-assistant';
import type { PublicBusinessProfile } from '@/lib/public-api';

export function PublicBookingAssistantHost({
  slug,
  tenant,
}: {
  slug: string;
  tenant: PublicBusinessProfile;
}) {
  return <PublicBookingAssistant slug={slug} tenant={tenant} />;
}
