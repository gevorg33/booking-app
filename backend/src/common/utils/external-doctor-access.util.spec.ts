import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canListExternalDoctorsRegistry,
  canManageExternalDoctorsRegistry,
} from './external-doctor-access.util.js';

describe('external-doctor-access.util', () => {
  it('allows lab ops roles to manage the registry', () => {
    expect(
      canManageExternalDoctorsRegistry({ membershipRole: MemberRole.MANAGER }),
    ).toBe(true);
    expect(
      canManageExternalDoctorsRegistry({ membershipRole: MemberRole.STAFF }),
    ).toBe(false);
  });

  it('allows any staff member to list doctors for chart selection', () => {
    expect(
      canListExternalDoctorsRegistry({
        membershipRole: MemberRole.STAFF,
        employeeId: 'emp-1',
      }),
    ).toBe(true);
  });
});
