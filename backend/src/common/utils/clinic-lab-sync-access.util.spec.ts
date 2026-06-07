import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canAssignClinicLabMachine,
  canManageClinicLabRegistry,
} from './clinic-lab-sync-access.util.js';
import { CLINIC_LAB_REGISTRY_ACCESS_SCENARIOS } from '../../modules/clinic-lis/clinic-lis.fixtures.js';

describe('clinic-lab-sync-access.util', () => {
  it.each(CLINIC_LAB_REGISTRY_ACCESS_SCENARIOS)(
    '$id registry access',
    ({ role, canManage }) => {
      const ctx = {
        userId: 'user-1',
        membershipRole: role,
        employeeId: 'emp-1',
      };
      expect(canManageClinicLabRegistry(ctx)).toBe(canManage);
      expect(canAssignClinicLabMachine(ctx)).toBe(canManage);
    },
  );

  it('allows owners to manage registry', () => {
    expect(
      canManageClinicLabRegistry({
        userId: 'user-1',
        membershipRole: MemberRole.OWNER,
        employeeId: null,
      }),
    ).toBe(true);
  });
});
