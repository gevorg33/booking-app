/** prov-exp-1.3 — customer staff notes from provider booking detail API. */

export interface ProviderBookingCustomerStaffNote {
  id: string;
  body: string | null;
  authorEmployeeId: string | null;
  authorName: string | null;
  bookingId: string | null;
  createdAt: string;
  phiMasked?: boolean;
}

export interface ProviderBookingCustomerStaffNotesList {
  notes: ProviderBookingCustomerStaffNote[];
  canCreate: boolean;
  maxLength: number;
}

export const PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH = 500;
