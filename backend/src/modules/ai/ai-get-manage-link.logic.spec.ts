import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleGetManageLinkLogic } from './ai-get-manage-link.logic.js';

describe('ai-get-manage-link.logic (ai-cmd-customer-4.4.5)', () => {
  const futureStart = new Date('2030-01-15T14:00:00.000Z');
  const guestBooking = {
    id: 'book-guest-1',
    businessId: 'biz-1',
    customerId: 'cust-guest',
    status: BookingStatus.CONFIRMED,
    startTime: futureStart,
    metadata: {},
    customer: { email: 'john@example.com', phone: '5551234567' },
    service: { name: 'Massage' },
    employee: { name: 'Anna' },
  };

  const deps = () => {
    const bookingRow = { ...guestBooking, metadata: { ...guestBooking.metadata } };
    const lockedQb = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => bookingRow),
    };
    const manager = {
      createQueryBuilder: jest.fn(() => lockedQb),
      save: jest.fn(async (_entity: unknown, booking: typeof bookingRow) => {
        Object.assign(bookingRow, booking);
        return bookingRow;
      }),
    };
    return {
      businessRepo: {
        findOne: jest.fn(async () => ({
          id: 'biz-1',
          slug: 'glow-salon',
        })),
      },
      bookingRepo: {
        find: jest.fn(async () => [bookingRow]),
        findOne: jest.fn(async () => bookingRow),
        save: jest.fn(async (booking: typeof bookingRow) => booking),
        manager: {
          transaction: jest.fn(async (cb: (m: typeof manager) => Promise<string>) =>
            cb(manager),
          ),
        },
      },
      configService: {
        get: jest.fn(() => 'http://localhost:3000'),
      },
      notificationsService: {
        sendBookingConfirmation: jest.fn(async () => undefined),
      },
      publicBookingService: {},
      publicCustomerBookingService: {},
      publicCustomerAuthService: {},
      packagesService: {},
      subscriptionsService: {},
      multiServiceBookingsService: {},
      serviceRepo: {},
    };
  };

  it('returns manage link for signed-in session booking', async () => {
    const localDeps = deps();
    const result = await handleGetManageLinkLogic(
      localDeps as any,
      'biz-1',
      { bookingId: 'book-guest-1', sessionCustomerId: 'cust-guest' },
      'Get manage link for my booking',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('get_manage_link');
    expect((result.details as { manageUrl?: string }).manageUrl).toContain(
      '/manage',
    );
  });

  it('supports guest lookup params without get_manage_link prompt', async () => {
    const localDeps = deps();
    const result = await handleGetManageLinkLogic(
      localDeps as any,
      'biz-1',
      {
        guestLookup: true,
        email: 'john@example.com',
        delivery: 'email',
      },
      '',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('get_manage_link');
    expect(
      localDeps.notificationsService.sendBookingConfirmation,
    ).toHaveBeenCalled();
  });

  it('asks for contact when guest lookup lacks email or phone', async () => {
    const result = await handleGetManageLinkLogic(
      deps() as any,
      'biz-1',
      { guestLookup: true, delivery: 'auto' },
      'I lost my booking confirmation email',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/email or phone/i);
  });

  it('returns not found when guest contact has no booking', async () => {
    const localDeps = deps();
    localDeps.bookingRepo.find = jest.fn(async () => []);
    const result = await handleGetManageLinkLogic(
      localDeps as any,
      'biz-1',
      {
        guestLookup: true,
        email: 'missing@example.com',
        delivery: 'email',
      },
      'Resend manage link to missing@example.com',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/No upcoming booking found/i);
  });

  it('clarifies when guest contact matches multiple bookings', async () => {
    const localDeps = deps();
    localDeps.bookingRepo.find = jest.fn(async () => [
      guestBooking,
      {
        ...guestBooking,
        id: 'book-guest-dup',
        startTime: new Date('2030-01-20T14:00:00.000Z'),
      },
    ]);
    const result = await handleGetManageLinkLogic(
      localDeps as any,
      'biz-1',
      {
        guestLookup: true,
        email: 'john@example.com',
        delivery: 'email',
      },
      'Resend manage link to john@example.com',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Multiple upcoming bookings/);
  });
});
