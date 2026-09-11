import { BookingStatus } from '../booking/entities/booking.entity.js';
import { makeBusiness } from '../business/entities/business.test-fixture.js';
import { handleNotifyRunningLateLogic } from './ai-notify-running-late.logic.js';

describe('ai-notify-running-late.logic (ai-cmd-customer-4.4.6)', () => {
  const startTime = new Date(Date.now() + 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  const booking = {
    id: 'book-1',
    businessId: 'biz-1',
    customerId: 'cust-1',
    status: BookingStatus.CONFIRMED,
    startTime,
    endTime,
    metadata: {},
    service: { name: 'Massage' },
  };

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () =>
        makeBusiness({ id: 'biz-1', slug: 'glow-salon' }),
      ),
    },
    bookingRepo: {
      find: jest.fn(async () => [booking]),
      findOne: jest.fn(async () => booking),
    },
    publicCustomerBookingService: {
      notifyRunningLate: jest.fn(async () => ({
        bookingId: 'book-1',
        minutesLate: 15,
        notifiedAt: '2030-06-01T13:45:00.000Z',
        staffNotified: true,
        customerRunningLate: {
          minutesLate: 15,
          notifiedAt: '2030-06-01T13:45:00.000Z',
        },
      })),
    },
    publicBookingService: {},
    publicCustomerAuthService: {},
    packagesService: {},
    subscriptionsService: {},
    multiServiceBookingsService: {},
    configService: {},
    serviceRepo: {},
  });

  it('requires sign-in', async () => {
    const result = await handleNotifyRunningLateLogic(
      deps() as any,
      'biz-1',
      {},
      "I'm 15 minutes late",
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Sign in/i);
  });

  it('notifies salon for signed-in customer', async () => {
    const result = await handleNotifyRunningLateLogic(
      deps() as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "I'm 15 minutes late",
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('notify_running_late');
    expect(result.summary).toMatch(/notified the salon/i);
  });

  it('notes when staff email alerts are disabled', async () => {
    const localDeps = deps();
    localDeps.publicCustomerBookingService.notifyRunningLate = jest.fn(
      async () => ({
        bookingId: 'book-1',
        minutesLate: 15,
        notifiedAt: '2030-06-01T13:45:00.000Z',
        staffNotified: false,
        customerRunningLate: {
          minutesLate: 15,
          notifiedAt: '2030-06-01T13:45:00.000Z',
        },
      }),
    );
    const result = await handleNotifyRunningLateLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "I'm 15 minutes late",
    );
    expect(result.success).toBe(true);
    expect(result.summary).toMatch(/Staff email alerts are off/);
  });

  it('clarifies when multiple bookings match', async () => {
    const localDeps = deps();
    localDeps.bookingRepo.find = jest.fn(async () => [
      booking,
      {
        ...booking,
        id: 'book-2',
        startTime: new Date('2030-06-02T14:00:00.000Z'),
      },
    ]);
    const result = await handleNotifyRunningLateLogic(
      localDeps as any,
      'biz-1',
      { sessionCustomerId: 'cust-1' },
      "I'm 15 minutes late",
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Multiple upcoming bookings/);
  });
});
