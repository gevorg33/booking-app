/** prov-exp-1.3 — customer staff notes on provider booking detail. */

import type { MobileAccess } from './provider-mobile-access.js';

export const PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH = 500;
export const PROVIDER_CUSTOMER_STAFF_NOTES_LIST_LIMIT = 20;

export interface ProviderBookingCustomerStaffNoteView {
  id: string;
  body: string | null;
  authorEmployeeId: string | null;
  authorName: string | null;
  bookingId: string | null;
  createdAt: string;
  phiMasked?: boolean;
}

export interface ProviderBookingCustomerStaffNotesListView {
  notes: ProviderBookingCustomerStaffNoteView[];
  canCreate: boolean;
  maxLength: number;
}

export function normalizeProviderCustomerStaffNoteBody(body: string): string {
  return body.trim();
}

export function isValidProviderCustomerStaffNoteBody(body: string): boolean {
  const normalized = normalizeProviderCustomerStaffNoteBody(body);
  return (
    normalized.length > 0 &&
    normalized.length <= PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH
  );
}

export function canWriteProviderBookingCustomerStaffNotes(
  access: MobileAccess,
): boolean {
  if (access.viewMode === 'team') return true;
  return !!access.employee;
}
