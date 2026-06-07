import { MemberRole } from '../../modules/business/entities/business-member.entity.js';
import {
  canAccessCustomerClinicalChart,
  canAccessCustomerClinicalPhi,
  isProviderScopedClinicalChartRole,
} from './clinic-chart-access.util.js';

describe('clinic-chart-access.util', () => {
  it('allows lab ops and receptionist roles for any customer', () => {
    expect(
      canAccessCustomerClinicalChart(
        { membershipRole: MemberRole.MANAGER, employeeId: 'emp-1' },
        { hasAssignedBooking: false },
      ),
    ).toBe(true);
    expect(
      canAccessCustomerClinicalChart(
        { membershipRole: MemberRole.STAFF, employeeId: null },
        { hasAssignedBooking: false },
      ),
    ).toBe(true);
  });

  it('scopes provider chart access to assigned bookings', () => {
    expect(
      canAccessCustomerClinicalChart(
        { membershipRole: MemberRole.STAFF, employeeId: 'emp-1' },
        { hasAssignedBooking: true },
      ),
    ).toBe(true);
    expect(
      canAccessCustomerClinicalChart(
        { membershipRole: MemberRole.STAFF, employeeId: 'emp-1' },
        { hasAssignedBooking: false },
      ),
    ).toBe(false);
  });

  it('re-exports phi access helper and provider scope detection', () => {
    expect(
      canAccessCustomerClinicalPhi(
        MemberRole.STAFF,
        { hasAssignedBooking: true },
        'emp-1',
      ),
    ).toBe(true);
    expect(
      isProviderScopedClinicalChartRole({
        membershipRole: MemberRole.STAFF,
        employeeId: 'emp-1',
      }),
    ).toBe(true);
    expect(
      isProviderScopedClinicalChartRole({
        membershipRole: MemberRole.MANAGER,
        employeeId: 'emp-1',
      }),
    ).toBe(false);
  });
});
