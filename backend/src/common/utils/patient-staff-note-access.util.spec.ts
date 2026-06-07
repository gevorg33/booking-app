import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canReadPatientStaffNotes,
  canWritePatientStaffNotes,
} from './patient-staff-note-access.util.js';

describe('patient-staff-note-access.util', () => {
  const assigned = { hasAssignedBooking: true };
  const unassigned = { hasAssignedBooking: false };

  it('allows lab_ops roles to read and write without assignment', () => {
    for (const role of [
      MemberRole.OWNER,
      MemberRole.ADMIN,
      MemberRole.MANAGER,
    ]) {
      const ctx = { membershipRole: role, employeeId: null };
      expect(canReadPatientStaffNotes(ctx, unassigned)).toBe(true);
      expect(canWritePatientStaffNotes(ctx, unassigned)).toBe(true);
    }
  });

  it('blocks receptionist-tier staff without employee linkage', () => {
    const ctx = { membershipRole: MemberRole.STAFF, employeeId: null };
    expect(canReadPatientStaffNotes(ctx, assigned)).toBe(false);
    expect(canWritePatientStaffNotes(ctx, assigned)).toBe(false);
  });

  it('allows assigned providers to read and write', () => {
    const ctx = { membershipRole: MemberRole.STAFF, employeeId: 'emp-1' };
    expect(canReadPatientStaffNotes(ctx, assigned)).toBe(true);
    expect(canWritePatientStaffNotes(ctx, assigned)).toBe(true);
  });

  it('blocks unassigned providers from reading staff notes', () => {
    const ctx = { membershipRole: MemberRole.STAFF, employeeId: 'emp-2' };
    expect(canReadPatientStaffNotes(ctx, unassigned)).toBe(false);
    expect(canWritePatientStaffNotes(ctx, unassigned)).toBe(false);
  });
});
