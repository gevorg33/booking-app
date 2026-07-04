import {
  handleCancelBookingWithTokenLogic,
  handleCancelPackageVisitWithTokenLogic,
  handleRescheduleBookingWithTokenLogic,
  handleReschedulePackageVisitWithTokenLogic,
} from './ai-manage-booking-with-token.logic.js';
import type { SelfServiceBookingLogicDeps } from './ai-self-service-booking.logic.js';

function buildDeps(
  overrides: Partial<SelfServiceBookingLogicDeps> = {},
): SelfServiceBookingLogicDeps {
  const business = { id: 'biz-1', slug: 'salon' };

  return {
    publicBookingService: {} as any,
    publicCustomerBookingService: {
      cancelBookingWithToken: jest.fn(async () => ({
        booking: { id: 'book-1', status: 'cancelled', service: { name: 'Haircut' } },
      })),
      rescheduleBookingWithToken: jest.fn(async () => ({
        booking: {
          id: 'book-1',
          startTime: new Date('2026-07-10T14:00:00.000Z'),
          service: { name: 'Haircut' },
        },
        previousStartTime: '2026-07-03T10:00:00.000Z',
      })),
      cancelPackageVisitWithToken: jest.fn(async () => ({
        bookings: [{ id: 'book-1' }, { id: 'book-2' }],
      })),
      reschedulePackageVisitWithToken: jest.fn(async () => ({
        bookings: [{ id: 'book-1' }, { id: 'book-2' }],
        previousStartTime: '2026-07-03T10:00:00.000Z',
      })),
      getManageContext: jest.fn(async () => ({
        bookingId: 'book-1',
        serviceId: 'svc-1',
        employeeId: 'emp-1',
        startTime: '2026-07-03T10:00:00.000Z',
        packageVisit: {
          appointments: [
            {
              bookingId: 'book-1',
              serviceId: 'svc-1',
              employeeId: 'emp-1',
              startTime: '2026-07-03T10:00:00.000Z',
            },
            {
              bookingId: 'book-2',
              serviceId: 'svc-2',
              employeeId: 'emp-1',
              startTime: '2026-07-03T11:00:00.000Z',
            },
          ],
        },
      })),
    } as any,
    publicCustomerWaitlistService: {} as any,
    publicCustomerAuthService: {} as any,
    publicConsumerSupportService: {} as any,
    packagesService: {} as any,
    subscriptionsService: {} as any,
    multiServiceBookingsService: {
      resolveSettingsFromBusiness: jest.fn(() => ({
        maxServiceCount: 5,
        turnoverBufferMinutes: 5,
        schedulingMode: 'same_visit',
      })),
    } as any,
    notificationsService: {} as any,
    bookingRepo: {} as any,
    businessRepo: {
      findOne: jest.fn(async () => business),
    } as any,
    serviceRepo: {
      find: jest.fn(async () => [
        { id: 'svc-1', durationMinutes: 60, bufferMinutes: 0 },
        { id: 'svc-2', durationMinutes: 30, bufferMinutes: 0 },
      ]),
    } as any,
    configService: {} as any,
    ...overrides,
  };
}

describe('ai-manage-booking-with-token.logic', () => {
  let deps: SelfServiceBookingLogicDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  describe('handleCancelBookingWithTokenLogic', () => {
    it('cancels a booking with a valid manage token', async () => {
      const result = await handleCancelBookingWithTokenLogic(deps, 'biz-1', {
        bookingId: 'book-1',
        manageToken: 'tok-123',
      });
      expect(result.success).toBe(true);
      expect(result.action).toBe('cancel_booking_with_token');
      expect(
        deps.publicCustomerBookingService.cancelBookingWithToken,
      ).toHaveBeenCalledWith('salon', 'book-1', 'tok-123');
    });

    it('extracts bookingId/token from a pasted manage link', async () => {
      const result = await handleCancelBookingWithTokenLogic(
        deps,
        'biz-1',
        {},
        'Cancel using https://app.test/salon/manage?bookingId=book-1&token=tok-123',
      );
      expect(result.success).toBe(true);
      expect(
        deps.publicCustomerBookingService.cancelBookingWithToken,
      ).toHaveBeenCalledWith('salon', 'book-1', 'tok-123');
    });

    it('clarifies when credentials are missing', async () => {
      const result = await handleCancelBookingWithTokenLogic(deps, 'biz-1', {});
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });

    it('fails gracefully on service error', async () => {
      (
        deps.publicCustomerBookingService.cancelBookingWithToken as jest.Mock
      ).mockRejectedValueOnce(new Error('Invalid or expired manage link'));
      const result = await handleCancelBookingWithTokenLogic(deps, 'biz-1', {
        bookingId: 'book-1',
        manageToken: 'bad-token',
      });
      expect(result.success).toBe(false);
      expect(result.summary).toBe('Invalid or expired manage link');
    });
  });

  describe('handleRescheduleBookingWithTokenLogic', () => {
    it('reschedules with explicit startTime', async () => {
      const result = await handleRescheduleBookingWithTokenLogic(deps, 'biz-1', {
        bookingId: 'book-1',
        manageToken: 'tok-123',
        startTime: '2026-07-10T14:00:00.000Z',
      });
      expect(result.success).toBe(true);
      expect(
        deps.publicCustomerBookingService.rescheduleBookingWithToken,
      ).toHaveBeenCalledWith('salon', 'book-1', 'tok-123', {
        startTime: '2026-07-10T14:00:00.000Z',
        employeeId: undefined,
      });
    });

    it('parses date/time from the prompt', async () => {
      const result = await handleRescheduleBookingWithTokenLogic(
        deps,
        'biz-1',
        { bookingId: 'book-1', manageToken: 'tok-123' },
        'Move it to Friday at 2pm',
      );
      expect(result.success).toBe(true);
    });

    it('clarifies when no new time is given', async () => {
      const result = await handleRescheduleBookingWithTokenLogic(deps, 'biz-1', {
        bookingId: 'book-1',
        manageToken: 'tok-123',
      });
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });
  });

  describe('handleCancelPackageVisitWithTokenLogic', () => {
    it('cancels all lines of a package visit', async () => {
      const result = await handleCancelPackageVisitWithTokenLogic(deps, 'biz-1', {
        bookingId: 'book-1',
        manageToken: 'tok-123',
      });
      expect(result.success).toBe(true);
      expect(result.details?.bookingIds).toEqual(['book-1', 'book-2']);
    });
  });

  describe('handleReschedulePackageVisitWithTokenLogic', () => {
    it('builds lines[] from manage context and reschedules the whole visit', async () => {
      const result = await handleReschedulePackageVisitWithTokenLogic(
        deps,
        'biz-1',
        {
          bookingId: 'book-1',
          manageToken: 'tok-123',
          startTime: '2026-07-10T09:00:00.000Z',
        },
      );
      expect(result.success).toBe(true);
      expect(
        deps.publicCustomerBookingService.reschedulePackageVisitWithToken,
      ).toHaveBeenCalledWith('salon', 'book-1', 'tok-123', {
        lines: [
          {
            bookingId: 'book-1',
            startTime: '2026-07-10T09:00:00.000Z',
            employeeId: 'emp-1',
          },
          {
            bookingId: 'book-2',
            startTime: '2026-07-10T10:05:00.000Z',
            employeeId: 'emp-1',
          },
        ],
      });
    });

    it('clarifies when no new time is given', async () => {
      const result = await handleReschedulePackageVisitWithTokenLogic(
        deps,
        'biz-1',
        { bookingId: 'book-1', manageToken: 'tok-123' },
      );
      expect(result.success).toBe(false);
      expect(result.details?.clarify).toBe(true);
    });
  });
});
