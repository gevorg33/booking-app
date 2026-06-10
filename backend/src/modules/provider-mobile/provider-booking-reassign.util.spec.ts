import { PROVIDER_REASSIGN_ELIGIBILITY_SCENARIOS } from './provider-booking-reassign.fixtures.js';
import {
  assertReassignKeepsStartTime,
  buildProviderReassignEligibility,
  canMutateProviderBookingEmployee,
  filterReassignTargetEmployees,
} from './provider-booking-reassign.util.js';

describe('provider-booking-reassign.util (prov-exp-4.2)', () => {
  it.each(PROVIDER_REASSIGN_ELIGIBILITY_SCENARIOS)(
    'buildProviderReassignEligibility — $id',
    ({ access, booking, allowed }) => {
      expect(buildProviderReassignEligibility(access, booking).allowed).toBe(
        allowed,
      );
    },
  );

  it('canMutateProviderBookingEmployee respects team vs own booking', () => {
    expect(
      canMutateProviderBookingEmployee(
        { viewMode: 'team', employeeId: null },
        'emp-2',
      ),
    ).toBe(true);
    expect(
      canMutateProviderBookingEmployee(
        { viewMode: 'provider', employeeId: 'emp-1' },
        'emp-1',
      ),
    ).toBe(true);
    expect(
      canMutateProviderBookingEmployee(
        { viewMode: 'provider', employeeId: 'emp-1' },
        'emp-2',
      ),
    ).toBe(false);
  });

  it('filters reassignment targets and preserves start time', () => {
    expect(
      filterReassignTargetEmployees(
        [
          { id: 'emp-1', name: 'Alex' },
          { id: 'emp-2', name: 'Zara' },
        ],
        'emp-1',
      ),
    ).toEqual([{ id: 'emp-2', name: 'Zara' }]);
    expect(
      assertReassignKeepsStartTime(
        new Date('2026-06-09T10:00:00.000Z'),
        '2026-06-09T10:00:00.000Z',
      ),
    ).toBe(true);
    expect(
      assertReassignKeepsStartTime(
        new Date('2026-06-09T10:00:00.000Z'),
        '2026-06-09T11:00:00.000Z',
      ),
    ).toBe(false);
  });
});
