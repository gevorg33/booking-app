import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  canWriteProviderBookingCustomerStaffNotes,
  isValidProviderCustomerStaffNoteBody,
  normalizeProviderCustomerStaffNoteBody,
  PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH,
} from './provider-booking-customer-staff-notes.util.js';

describe('provider-booking-customer-staff-notes.util (prov-exp-1.3)', () => {
  it('normalizes note body', () => {
    expect(normalizeProviderCustomerStaffNoteBody('  hello  ')).toBe('hello');
  });

  it('validates note length up to 500 chars', () => {
    expect(isValidProviderCustomerStaffNoteBody('ok')).toBe(true);
    expect(
      isValidProviderCustomerStaffNoteBody('x'.repeat(PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH)),
    ).toBe(true);
    expect(
      isValidProviderCustomerStaffNoteBody(
        'x'.repeat(PROVIDER_CUSTOMER_STAFF_NOTE_MAX_LENGTH + 1),
      ),
    ).toBe(false);
    expect(isValidProviderCustomerStaffNoteBody('   ')).toBe(false);
  });

  it('allows team managers and linked providers to write notes', () => {
    expect(
      canWriteProviderBookingCustomerStaffNotes({
        viewMode: 'team',
        membershipRole: MemberRole.MANAGER,
        employee: null,
      }),
    ).toBe(true);
    expect(
      canWriteProviderBookingCustomerStaffNotes({
        viewMode: 'provider',
        membershipRole: MemberRole.STAFF,
        employee: { id: 'emp-1' } as never,
      }),
    ).toBe(true);
    expect(
      canWriteProviderBookingCustomerStaffNotes({
        viewMode: 'provider',
        membershipRole: MemberRole.STAFF,
        employee: null,
      }),
    ).toBe(false);
  });
});
