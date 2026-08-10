import type { Business } from '../business/entities/business.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import {
  handleReschedulePackageLinesLogic,
  type ReschedulePackageLinesLogicDeps,
} from './ai-reschedule-package-lines.logic.js';

const business = { id: 'biz-1', slug: 'salon' } as Business;

const visit1 = {
  id: 'book-1',
  startTime: '2026-07-06T10:00:00.000Z',
  status: BookingStatus.CONFIRMED,
  packagePurchaseId: 'purchase-1',
  packageName: 'Spa Day',
  serviceName: 'Massage',
  employeeId: 'emp-1',
};
const visit2 = {
  id: 'book-2',
  startTime: '2026-07-13T11:00:00.000Z',
  status: BookingStatus.CONFIRMED,
  packagePurchaseId: 'purchase-1',
  packageName: 'Spa Day',
  serviceName: 'Facial',
  employeeId: 'emp-2',
};
const visit3 = {
  id: 'book-3',
  startTime: '2026-07-20T09:00:00.000Z',
  status: BookingStatus.CONFIRMED,
  packagePurchaseId: 'purchase-1',
  packageName: 'Spa Day',
  serviceName: 'Manicure',
  employeeId: 'emp-3',
};

function buildDeps(
  overrides: Partial<ReschedulePackageLinesLogicDeps> = {},
): ReschedulePackageLinesLogicDeps {
  return {
    businessRepo: { findOne: jest.fn().mockResolvedValue(business) },
    publicCustomerAuthService: {
      listBookings: jest
        .fn()
        .mockResolvedValue({ bookings: [visit1, visit2, visit3] }),
    },
    publicCustomerBookingService: {
      reschedulePackageVisit: jest.fn().mockResolvedValue({
        bookings: [visit2, visit3],
        previousStartTime: visit2.startTime,
      }),
    },
    ...overrides,
  } as ReschedulePackageLinesLogicDeps;
}

describe('handleReschedulePackageLinesLogic', () => {
  it('reschedules two selected visits to a shared target date', async () => {
    const deps = buildDeps();
    const result = await handleReschedulePackageLinesLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Move visits 2 and 3 to Friday',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('reschedule_package_lines');
    expect(
      deps.publicCustomerBookingService.reschedulePackageVisit,
    ).toHaveBeenCalledWith(
      'salon',
      'cust-1',
      'book-2',
      expect.objectContaining({
        lines: [
          expect.objectContaining({ bookingId: 'book-2' }),
          expect.objectContaining({ bookingId: 'book-3' }),
        ],
      }),
    );
  });

  it('preserves each visit’s own time of day when shifting date', async () => {
    const deps = buildDeps();
    await handleReschedulePackageLinesLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Move visits 2 and 3 to Friday',
    );
    const call = (
      deps.publicCustomerBookingService.reschedulePackageVisit as jest.Mock
    ).mock.calls[0];
    const lines = call[3].lines as Array<{ startTime: string }>;
    expect(new Date(lines[0].startTime).getUTCHours()).toBe(11);
    expect(new Date(lines[1].startTime).getUTCHours()).toBe(9);
  });

  it('requires sign-in', async () => {
    const result = await handleReschedulePackageLinesLogic(
      buildDeps(),
      'biz-1',
      {},
      'Move visits 2 and 3 to Friday',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });

  it('requires at least two visit indexes', async () => {
    const result = await handleReschedulePackageLinesLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Reschedule my spa day',
    );
    expect(result.success).toBe(false);
    expect(result.details?.missing).toEqual(['visitIndexes']);
  });

  it('asks for a date when none is resolved', async () => {
    const result = await handleReschedulePackageLinesLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Move visits 2 and 3 to next week',
    );
    expect(result.success).toBe(true);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.visitIndexes).toEqual([2, 3]);
  });

  it('reports when a visit index does not exist', async () => {
    const result = await handleReschedulePackageLinesLogic(
      buildDeps(),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Move visits 2 and 9 to Friday',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('9');
  });

  it('flags ambiguity across multiple active packages', async () => {
    const otherPackageVisit = {
      ...visit1,
      id: 'book-4',
      packagePurchaseId: 'purchase-2',
      packageName: 'Wellness Bundle',
    };
    const deps = buildDeps({
      publicCustomerAuthService: {
        listBookings: jest.fn().mockResolvedValue({
          bookings: [visit1, visit2, visit3, otherPackageVisit],
        }),
      },
    });
    const result = await handleReschedulePackageLinesLogic(
      deps,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Move visits 2 and 3 to Friday',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
    expect(result.details?.missing).toEqual(['packageName']);
  });

  it('surfaces a reschedule failure', async () => {
    const result = await handleReschedulePackageLinesLogic(
      buildDeps({
        publicCustomerBookingService: {
          reschedulePackageVisit: jest.fn(async () => {
            throw new Error('Slot no longer available');
          }),
        },
      }),
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      'Move visits 2 and 3 to Friday',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toContain('Slot no longer available');
  });
});
