import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canListClinicDiagnosticCodes,
  canManageClinicDiagnosticCodes,
} from './clinic-diagnostic-code-access.util.js';

describe('clinic-diagnostic-code-access.util', () => {
  const labOpsCtx = {
    userId: 'user-lab',
    membershipRole: MemberRole.MANAGER,
    employeeId: 'emp-lab-1',
  };
  const providerCtx = {
    userId: 'user-provider',
    membershipRole: MemberRole.STAFF,
    employeeId: 'emp-provider-1',
  };

  it('allows any clinic staff member to list catalog entries', () => {
    expect(canListClinicDiagnosticCodes(labOpsCtx)).toBe(true);
    expect(canListClinicDiagnosticCodes(providerCtx)).toBe(true);
  });

  it('restricts catalog management to lab ops roles', () => {
    expect(canManageClinicDiagnosticCodes(labOpsCtx)).toBe(true);
    expect(canManageClinicDiagnosticCodes(providerCtx)).toBe(false);
  });
});
