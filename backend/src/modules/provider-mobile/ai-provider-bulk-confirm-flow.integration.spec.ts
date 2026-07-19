import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { MemberRole } from '../business/entities/business-member.entity.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import { createProviderAiCommandHarness } from './provider-ai-command.integration.harness.js';

describe('provider AI bulk-booking confirm→execute flow (ai-cmd-provider-6.4.2)', () => {
  const businessId = 'biz-64';
  const userId = 'user-64';
  const employeeId = 'emp-64';

  let service: ReturnType<typeof createProviderAiCommandHarness>;
  let llm: { isAvailableForBusiness: jest.Mock; completeJson: jest.Mock<any> };
  let bookingRepo: { find: jest.Mock<any> };
  let bookingService: { update: jest.Mock; cancel: jest.Mock };
  let resolveMobileAccess: jest.Mock<any>;

  const staffAccess = {
    viewMode: 'provider' as const,
    membershipRole: MemberRole.STAFF,
    employee: { id: employeeId, name: 'Alex Provider' },
  };

  const ownerAccess = {
    viewMode: 'team' as const,
    membershipRole: MemberRole.OWNER,
    employee: { id: employeeId, name: 'Alex Owner' },
  };

  function bookingRow(id: string, overrides: Record<string, unknown> = {}) {
    return {
      id,
      businessId,
      employeeId,
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      startTime: new Date('2026-08-01T14:00:00Z'),
      endTime: new Date('2026-08-01T14:30:00Z'),
      customer: { name: `Customer ${id}` },
      service: { name: 'Haircut' },
      ...overrides,
    };
  }

  const twoAfternoonBookings = [bookingRow('bk-1'), bookingRow('bk-2')];

  beforeEach(() => {
    llm = {
      isAvailableForBusiness: jest.fn(async () => true),
      completeJson: jest.fn(),
    };
    bookingRepo = { find: jest.fn(async () => twoAfternoonBookings) };
    bookingService = {
      update: jest.fn(async () => undefined),
      cancel: jest.fn(async () => undefined),
    };
    resolveMobileAccess = jest.fn(async () => staffAccess);
    service = createProviderAiCommandHarness({
      llm,
      providerMobile: {
        resolveMobileAccess,
        getScopedEmployeeId: jest.fn(() => employeeId),
      },
      bookingRepo,
      bookingService,
    });
  });

  function mockIntent(action: string, params: Record<string, unknown>) {
    llm.completeJson.mockResolvedValue({ action, params, reasoning: 'test' });
  }

  it('cancel_bookings: a single matched booking (below BULK_CONFIRM_THRESHOLD=2) executes immediately without confirmation', async () => {
    bookingRepo.find.mockResolvedValue([bookingRow('bk-solo')]);
    mockIntent('cancel_bookings', { date: '2026-08-01', reason: 'weather' });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Cancel my 14:00 appointment',
      [],
    );
    expect(result.success).toBe(true);
    expect(result.details).not.toMatchObject({ requiresConfirmation: true });
    expect(bookingService.cancel).toHaveBeenCalledTimes(1);
    expect(bookingService.cancel).toHaveBeenCalledWith(
      'bk-solo',
      'weather',
      userId,
    );
  });

  it('cancel_bookings: asks for confirmation first, then executes once confirmed', async () => {
    mockIntent('cancel_bookings', { date: '2026-08-01', reason: 'weather' });

    const preview = await service.executeCommand(
      businessId,
      userId,
      'Cancel all my afternoon appointments',
      [],
    );
    expect(preview.success).toBe(true);
    expect(preview.details).toMatchObject({ requiresConfirmation: true });
    expect(bookingService.cancel).not.toHaveBeenCalled();

    const executed = await service.executeCommand(
      businessId,
      userId,
      'Cancel all my afternoon appointments',
      [],
      { confirmed: true },
    );
    expect(executed.success).toBe(true);
    expect(bookingService.cancel).toHaveBeenCalledTimes(2);
  });

  it('update_bookings: asks for confirmation first, then executes once confirmed', async () => {
    mockIntent('update_bookings', {
      date: '2026-08-01',
      status: 'done',
      allAppointments: true,
    });

    const preview = await service.executeCommand(
      businessId,
      userId,
      "Mark today's afternoon appointments as done",
      [],
    );
    expect(preview.details).toMatchObject({ requiresConfirmation: true });
    expect(bookingService.update).not.toHaveBeenCalled();

    const executed = await service.executeCommand(
      businessId,
      userId,
      "Mark today's afternoon appointments as done",
      [],
      { confirmed: true },
    );
    expect(executed.success).toBe(true);
    expect(bookingService.update).toHaveBeenCalledTimes(2);
  });

  it('mark_visit_complete (ai-cmd-provider-5.2.7): forces status=completed and relabels the result action', async () => {
    bookingRepo.find.mockResolvedValue([bookingRow('bk-solo')]);
    mockIntent('mark_visit_complete', { date: '2026-08-01' });

    const result = await service.executeCommand(
      businessId,
      userId,
      'Mark done',
      [],
    );
    expect(result.success).toBe(true);
    expect(result.action).toBe('mark_visit_complete');
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-solo',
      { status: BookingStatus.COMPLETED },
      userId,
    );
  });

  it('payment_sweep ("mark all today paid"): asks for confirmation first, then executes once confirmed', async () => {
    resolveMobileAccess.mockResolvedValue(ownerAccess);
    mockIntent('payment_sweep', { date: '2026-08-01' });

    const preview = await service.executeCommand(
      businessId,
      userId,
      'Mark all today paid',
      [],
    );
    expect(preview.details).toMatchObject({ requiresConfirmation: true });
    expect(bookingService.update).not.toHaveBeenCalled();

    const executed = await service.executeCommand(
      businessId,
      userId,
      'Mark all today paid',
      [],
      { confirmed: true },
    );
    expect(executed.success).toBe(true);
    expect(bookingService.update).toHaveBeenCalledTimes(2);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-1',
      { paymentStatus: PaymentStatus.PAID },
      userId,
    );
  });

  it('mark_no_shows ("no-shows today"): asks for confirmation first, then executes once confirmed', async () => {
    const pastBookings = [
      bookingRow('bk-1', { startTime: new Date('2020-01-01T09:00:00Z') }),
      bookingRow('bk-2', { startTime: new Date('2020-01-01T10:00:00Z') }),
    ];
    bookingRepo.find.mockImplementation(async () => pastBookings);
    mockIntent('mark_no_shows', { date: '2020-01-01' });

    const preview = await service.executeCommand(
      businessId,
      userId,
      'No-shows today',
      [],
    );
    expect(preview.details).toMatchObject({ requiresConfirmation: true });
    expect(bookingService.update).not.toHaveBeenCalled();

    const executed = await service.executeCommand(
      businessId,
      userId,
      'No-shows today',
      [],
      { confirmed: true },
    );
    expect(executed.success).toBe(true);
    expect(bookingService.update).toHaveBeenCalledTimes(2);
    expect(bookingService.update).toHaveBeenCalledWith(
      'bk-1',
      { status: BookingStatus.NO_SHOW },
      userId,
    );
  });
});
