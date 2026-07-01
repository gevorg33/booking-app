import { BookingStatus } from '../booking/entities/booking.entity.js';
import { handleRecoverLostManageLinkLogic } from './ai-recover-lost-manage-link.logic.js';
import { RECOVER_LOST_MANAGE_LINK_PROMPTS } from './ai-recover-lost-manage-link.fixtures.js';

describe('ai-recover-lost-manage-link.logic (ai-cmd-customer-4.17.3)', () => {
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

  const guestBookings = [
    guestBooking,
    {
      ...guestBooking,
      id: 'book-guest-2',
      customer: { email: 'sarah@test.com', phone: null },
    },
    {
      ...guestBooking,
      id: 'book-guest-3',
      customer: { email: 'mia@salon.com', phone: null },
    },
    {
      ...guestBooking,
      id: 'book-guest-4',
      customer: { email: null, phone: '5559876543' },
    },
  ];

  const deps = () => ({
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        slug: 'glow-salon',
      })),
    },
    bookingRepo: {
      find: jest.fn(async () => guestBookings),
      findOne: jest.fn(async () => guestBooking),
      save: jest.fn(async (booking: typeof guestBooking) => booking),
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
  });

  it('resends manage link for guest email lookup', async () => {
    const localDeps = deps();
    const result = await handleRecoverLostManageLinkLogic(
      localDeps as any,
      'biz-1',
      {},
      'Resend manage link to john@example.com',
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('recover_lost_manage_link');
    expect(result.summary).toMatch(/resent/i);
    expect((result.details as { manageUrl?: string }).manageUrl).toContain(
      '/manage',
    );
    expect(
      localDeps.notificationsService.sendBookingConfirmation,
    ).toHaveBeenCalledWith('book-guest-1');
  });

  it('asks for contact when guest lookup has no email or phone', async () => {
    const result = await handleRecoverLostManageLinkLogic(
      deps() as any,
      'biz-1',
      {},
      'I lost my booking confirmation email',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('recover_lost_manage_link');
    expect(result.summary).toMatch(/email or phone/i);
  });

  it('returns not found when guest contact has no booking', async () => {
    const localDeps = deps();
    localDeps.bookingRepo.find = jest.fn(async () => []);
    const result = await handleRecoverLostManageLinkLogic(
      localDeps as any,
      'biz-1',
      {},
      'Resend manage link to missing@example.com',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('recover_lost_manage_link');
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
    const result = await handleRecoverLostManageLinkLogic(
      localDeps as any,
      'biz-1',
      {},
      'Resend manage link to john@example.com',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/Multiple upcoming bookings/);
  });

  it('rejects unrelated prompts', async () => {
    const result = await handleRecoverLostManageLinkLogic(
      deps() as any,
      'biz-1',
      {},
      'What services do you offer?',
    );
    expect(result.success).toBe(false);
    expect(result.action).toBe('recover_lost_manage_link');
  });

  it('fails when prompt is empty and params do not parse', async () => {
    const result = await handleRecoverLostManageLinkLogic(
      deps() as any,
      'biz-1',
      {},
      '',
    );
    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/email or phone/i);
  });
});
