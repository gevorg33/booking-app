import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import { BookingStatus } from '../booking/entities/booking.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI bulk-booking bookingId targeting (ai-cmd-provider-6.3.5)', () => {
  const businessId = 'biz-635';
  const userId = 'user-635';
  const employeeId = 'emp-635';
  const bookingId = 'book-target-1';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let bookingRepo: { find: jest.Mock };
  let bookingService: { update: jest.Mock; cancel: jest.Mock };

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  const targetBooking = {
    id: bookingId,
    businessId,
    employeeId,
    status: BookingStatus.CONFIRMED,
    startTime: new Date('2026-08-01T10:00:00Z'),
    customer: { name: 'Jane' },
    service: { name: 'Haircut' },
  };

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    bookingRepo = { find: jest.fn(async () => [targetBooking]) };
    bookingService = {
      update: jest.fn(async () => undefined),
      cancel: jest.fn(async () => undefined),
    };
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess: jest.fn(async () => staffAccess),
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      bookingRepo,
      bookingService,
    });
  });

  function mockIntent(action: string, params: Record<string, unknown>) {
    llm.completeJson.mockResolvedValue({ action, params, reasoning: 'test' });
  }

  it('targets only the explicit bookingId for update_bookings, ignoring today-scoped date filtering', async () => {
    mockIntent('update_bookings', { bookingId, status: 'done' });
    const result = await service.executeCommand(
      businessId,
      userId,
      'Mark this booking as done',
      [],
    );

    expect(bookingRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: bookingId }),
      }),
    );
    const call = bookingRepo.find.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(call.where.startTime).toBeUndefined();
    expect(bookingService.update).toHaveBeenCalledWith(
      bookingId,
      { status: BookingStatus.COMPLETED },
      userId,
    );
    expect(result.action).toBe('update_bookings');
    expect(result.success).toBe(true);
  });

  it('targets only the explicit bookingId for cancel_bookings, ignoring today-scoped date filtering', async () => {
    mockIntent('cancel_bookings', { bookingId, reason: 'client request' });
    const result = await service.executeCommand(
      businessId,
      userId,
      'Cancel this booking',
      [],
    );

    expect(bookingRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: bookingId }),
      }),
    );
    const call = bookingRepo.find.mock.calls[0][0] as {
      where: Record<string, unknown>;
    };
    expect(call.where.startTime).toBeUndefined();
    expect(bookingService.cancel).toHaveBeenCalledWith(
      bookingId,
      'client request',
      userId,
    );
    expect(result.action).toBe('cancel_bookings');
    expect(result.success).toBe(true);
  });
});
