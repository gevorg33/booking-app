import { track } from './app-analytics';
import type { StaffContactChannel } from './provider-customer-contact.util';

export function trackStaffContactedCustomer(
  bookingId: string,
  channel: StaffContactChannel,
  templateId?: string | null,
): void {
  if (!bookingId.trim()) return;
  track('staff_contacted_customer', {
    bookingId: bookingId.trim(),
    contactChannel: channel,
    ...(templateId?.trim() ? { templateId: templateId.trim() } : {}),
  });
}
