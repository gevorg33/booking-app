import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canAccessBookingPhi,
  maskBookingPhiFields,
} from './phi-minimum-access.util.js';

describe('phi-minimum-access.util', () => {
  const booking = {
    employeeId: 'emp-primary',
    linkedEmployeeIds: ['emp-assist'],
  };

  it.each([
    { role: MemberRole.OWNER, employeeId: null, allowed: true },
    { role: MemberRole.ADMIN, employeeId: null, allowed: true },
    { role: MemberRole.MANAGER, employeeId: null, allowed: true },
    { role: MemberRole.STAFF, employeeId: 'emp-primary', allowed: true },
    { role: MemberRole.STAFF, employeeId: 'emp-assist', allowed: true },
    { role: MemberRole.STAFF, employeeId: 'emp-other', allowed: false },
    { role: MemberRole.STAFF, employeeId: null, allowed: false },
    { role: MemberRole.CONTRIBUTOR, employeeId: 'emp-primary', allowed: true },
  ])(
    'canAccessBookingPhi role=$role employeeId=$employeeId => $allowed',
    ({ role, employeeId, allowed }) => {
      expect(canAccessBookingPhi(role, booking, employeeId)).toBe(allowed);
    },
  );

  it('allows linked assistant employees to read PHI', () => {
    expect(canAccessBookingPhi(MemberRole.STAFF, booking, 'emp-assist')).toBe(
      true,
    );
    expect(
      canAccessBookingPhi(
        MemberRole.STAFF,
        { employeeId: 'emp-x', linkedEmployeeIds: null },
        'emp-x',
      ),
    ).toBe(true);
  });

  it('denies staff when linkedEmployeeIds is omitted and booking is unassigned', () => {
    expect(
      canAccessBookingPhi(
        MemberRole.STAFF,
        { employeeId: 'emp-primary' },
        'emp-other',
      ),
    ).toBe(false);
  });

  it('masks notes when metadata is absent', () => {
    expect(maskBookingPhiFields({ notes: 'phi:v1:abc' })).toEqual({
      notes: null,
    });
  });

  it('masks PHI fields without decrypting ciphertext', () => {
    const masked = maskBookingPhiFields({
      notes: 'phi:v1:abc',
      metadata: {
        referralNotes: 'phi:v1:def',
        symptoms: 'cough',
        patient_test_results: [{ notes: 'lab' }],
        pricing: { amountDue: 10 },
      },
    });
    expect(masked.notes).toBeNull();
    expect(masked.metadata?.referralNotes).toBeUndefined();
    expect(masked.metadata?.symptoms).toBeUndefined();
    expect(
      (masked.metadata?.patient_test_results as Array<{ notes?: string }>)[0]
        .notes,
    ).toBeUndefined();
    expect(masked.metadata?.pricing).toEqual({ amountDue: 10 });
  });

  it('preserves non-object patient_test_results entries', () => {
    const masked = maskBookingPhiFields({
      metadata: {
        patient_test_results: [null, 'invalid', { notes: 'lab' }],
      },
    });
    expect(masked.metadata?.patient_test_results).toEqual([
      null,
      'invalid',
      {},
    ]);
  });
});
